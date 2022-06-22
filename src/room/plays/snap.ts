import BallContact from "../classes/BallContact";
import PlayerContact from "../classes/PlayerContact";
import {
  PlayableTeamId,
  PlayerObject,
  PlayerObjFlat,
  Position,
  Speed,
} from "../HBClient";
import Chat from "../roomStructures/Chat";
import Ball from "../roomStructures/Ball";
import GameReferee from "../structures/GameReferee";
import MapReferee from "../structures/MapReferee";
import PreSetCalculators from "../structures/PreSetCalculators";
import ICONS from "../utils/Icons";
import MapSectionFinder, { MapSectionName } from "../utils/MapSectionFinder";
import SnapEvents from "./play_events/Snap.events";
import { GameCommandError } from "../commands/GameCommandHandler";
import PenaltyDataGetter, {
  PenaltyName,
  AdditionalPenaltyData,
} from "../structures/PenaltyDataGetter";
import { getPlayerDiscProperties, quickPause } from "../utils/haxUtils";
import { MAP_POINTS } from "../utils/map";
import SnapCrowdChecker from "../structures/SnapCrowdChecker";
import DistanceCalculator from "../structures/DistanceCalculator";
import { PlayerStatQuery } from "../classes/PlayerStats";
import { EndPlayData } from "./BasePlay";
import { round } from "../utils/utils";
import client from "..";
import Room from "../roomStructures/Room";

export type BadIntReasons =
  | "Blocked by offense"
  | "Illegally touched by defense"
  | "Missed"
  | "Drag on kick"
  | "Out of bounds during attempt"
  | "Ball out of bounds";

export default class Snap extends SnapEvents {
  private _quarterback: PlayerObject;
  private _blitzClock: NodeJS.Timer | null;
  private _blitzClockTime: number = 0;
  private _ballMoveBlitzClock: NodeJS.Timer | null;
  private _ballMoveBlitzClockTime: number = 0;
  private readonly BLITZ_TIME_SECONDS: number = 12;
  private readonly BALL_MOVE_BLITZ_TIME_SECONDS: number = 3;
  private readonly crowdChecker: SnapCrowdChecker = new SnapCrowdChecker();
  MAX_DRAG_DISTANCE: number = 10;
  constructor(time: number, quarterback: PlayerObject) {
    super(time);
    this._quarterback = quarterback;
    this._ballCarrier = quarterback;
  }

  validateBeforePlayBegins(player: PlayerObject | null) {
    if (Room.game.canStartSnapPlay === false)
      throw new GameCommandError(
        "Please wait a second before snapping the ball",
        true
      );

    Room.game.updateStaticPlayers();
    Room.game.players.savePlayerPositions();

    const {
      valid,
      penaltyName,
      player: penaltiedPlayer,
      penaltyData,
    } = new SnapValidator(player as PlayerObject).validate();

    if (!valid) {
      this._handlePenalty(penaltyName!, penaltiedPlayer!, penaltyData);
      throw new GameCommandError("Penalty", false);
    }
  }

  prepare() {
    this.crowdChecker.setOffenseTeam(Room.game.offenseTeamId);
    this.crowdChecker.setCrowdBoxArea(Room.game.down.getLOS().x);

    const isCurvePass = Room.game.stateExists("curvePass");
    const isTwoPointAttempt = Room.game.stateExists("twoPointAttempt");

    this._setStartingPosition(Room.game.down.getLOS());
    this.setBallPositionOnSet(Ball.getPosition());
    Room.game.down.moveFieldMarkers();
    this._getAllOffsideOffenseAndMove();
    this._getAllOffsideDefenseAndMove();
    this._startBlitzClock();

    if (isTwoPointAttempt) {
      this.setState("twoPointAttempt");
    }

    if (isCurvePass) this.setState("curvePass");
  }

  run() {
    this._setLivePlay(true);
    Ball.release();
    this.setState("ballSnapped");
    Chat.sendMessageMaybeWithClock(
      `${ICONS.GreenCircle} Ball is Hiked`,
      this.time
    );
  }

  cleanUp() {
    this._stopBlitzClock();
    this._stopBallMoveBlitzClock();
  }

  getQuarterback() {
    return this._quarterback;
  }

  findCrowderAndHandle() {
    const fieldedPlayers = Room.game.players
      .getFielded()
      .filter((player) => player.id !== this._quarterback.id);

    const { isCrowding, crowdingData, crowder } =
      this.crowdChecker.checkPlayersInCrowdBox(
        fieldedPlayers,
        Room.game.getTime()
      );

    if (isCrowding) {
      if (crowdingData!.wasAlone)
        return this._handlePenalty("crowdAbuse", crowder!);
      return this._handlePenalty("crowding", crowder!);
    }
  }

  protected _handlePenalty<T extends PenaltyName>(
    penaltyName: T,
    player: PlayerObjFlat,
    penaltyData: AdditionalPenaltyData = {}
  ): void {
    // We have to check the room and play state, since play state may not be sent on a snap penalty
    if (
      this.stateExists("twoPointAttempt") ||
      Room.game.stateExists("twoPointAttempt")
    ) {
      quickPause();

      const losX = Room.game.down.getLOS().x;

      const isInDefenseRedzone =
        MapReferee.checkIfInRedzone(losX) === Room.game.defenseTeamId;

      const { penaltyMessage } = new PenaltyDataGetter().getData(
        penaltyName,
        player,
        isInDefenseRedzone,
        losX,
        Room.game.offenseTeamId,
        penaltyData
      );

      // Lets send the penalty!
      Chat.send(`${ICONS.YellowSquare} ${penaltyMessage}`);

      // Now if the penalty was on an offensive player, handle failed two point
      if (player.team === Room.game.offenseTeamId)
        return this._handleFailedTwoPointConversion();

      return this._handleTwoPointTouchdown();
    }

    super._handlePenalty(penaltyName, player, penaltyData);
  }

  endPlay(endPlayData: EndPlayData) {
    if (this.stateExists("twoPointAttempt")) {
      // Endplay will only run when we didn't score a touchdown, so means unsuccessful fg
      return this._handleFailedTwoPointConversion();
    }
    super.endPlay(endPlayData);
  }

  /**
   * Have to redeclare since we only add one point to defensive team for a safety during a two point
   */
  handleSafety() {
    if (this.stateExists("twoPointAttempt")) {
      this._setLivePlay(false);
      Chat.send(`${ICONS.Loudspeaker} Conversion safety!`);
      // Defense gets one point
      Room.game.addScore(Room.game.defenseTeamId, 1);
      return this._handleFailedTwoPointConversion();
    }

    super._handleSafety();
  }

  /**
   * Handles an auto touchdown after three redzone penalties
   */
  handleAutoTouchdown() {
    Chat.send(`${ICONS.Fire} Automatic Touchdown! - 3/3 Penalties`, {
      sound: 2,
    });

    this.allowForTwoPointAttempt();

    this.scorePlay(7, Room.game.offenseTeamId, Room.game.defenseTeamId);
  }

  handleTouchdown(position: Position) {
    // First we need to get the type of touchdown, then handle
    if (this.stateExistsUnsafe("twoPointAttempt"))
      return this._handleTwoPointTouchdown();
    return this._handleRegularTouchdown(position);
  }

  handleIllegalCrossOffense(player: PlayerObjFlat) {
    this._handlePenalty("illegalLosCross", player);
  }

  handleIllegalBlitz(player: PlayerObject) {
    this._handlePenalty("illegalBlitz", player, { time: this._blitzClockTime });
  }

  protected _updateStatsIfNotTwoPoint(
    playerId: PlayerObject["id"],
    statsQuery: Partial<PlayerStatQuery>
  ) {
    if (this.stateExists("twoPointAttempt")) return;
    Room.game.stats.updatePlayerStat(playerId, statsQuery);
  }

  handleBallInFrontOfLOS() {
    this._handlePenalty("illegalPass", this._quarterback);
  }

  protected _startBlitzClock() {
    this._blitzClock = setInterval(this._blitzTimerInterval.bind(this), 1000);
  }

  private _blitzTimerInterval() {
    this._blitzClockTime++;
    if (this._blitzClockTime >= this.BLITZ_TIME_SECONDS) {
      this.setState("canBlitz");
      return this._stopBlitzClock();
    }
  }

  private _stopBlitzClock() {
    if (this._blitzClock === null) return;
    clearInterval(this._blitzClock);
  }

  protected _startBallMoveBlitzClock() {
    this._ballMoveBlitzClock = setInterval(
      this._ballMoveBlitzTimerInterval.bind(this),
      1000
    );
  }

  private _ballMoveBlitzTimerInterval() {
    this._ballMoveBlitzClockTime++;
    if (this._ballMoveBlitzClockTime >= this.BALL_MOVE_BLITZ_TIME_SECONDS) {
      this.setState("canBlitz");

      const playAlreadyDead =
        this.stateExists("ballPassed") ||
        this.stateExists("ballRan") ||
        this.stateExists("ballBlitzed");
      this._stopBallMoveBlitzClock();
      if (playAlreadyDead) return;
      Chat.send(`${ICONS.Bell} Can Blitz`, { sound: 2 });
    }
  }

  private _stopBallMoveBlitzClock() {
    if (this._ballMoveBlitzClock === null) return;
    clearInterval(this._ballMoveBlitzClock);
  }

  protected _getStatInfo(endPosition: Position): {
    quarterback: PlayerObject;
    mapSection: MapSectionName;
  } {
    const losX = Room.game.down.getLOS().x;

    const mapSection = new MapSectionFinder().getSectionName(
      endPosition,
      losX,
      Room.game.offenseTeamId
    );
    const quarterback = this.getQuarterback();

    return {
      quarterback,
      mapSection,
    };
  }

  protected _handleCatch(ballContactObj: BallContact) {
    const { player, playerPosition } = ballContactObj;

    const { mapSection, quarterback } = this._getStatInfo(playerPosition);

    this._updateStatsIfNotTwoPoint(quarterback.id, {
      passAttempts: { [mapSection]: 1 },
    });

    if (this.stateExists("curvePass")) {
      this._updateStatsIfNotTwoPoint(this.getQuarterback().id, {
        curvedPassAttempts: 1,
      });
    }

    const isOutOfBounds = MapReferee.checkIfPlayerOutOfBounds(playerPosition);

    if (isOutOfBounds) {
      Chat.send(`${ICONS.DoNotEnter} Pass Incomplete, caught out of bounds`);
      return this.endPlay({});
    }

    /// Its a legal catch
    const adjustedPlayerPosition = PreSetCalculators.adjustRawEndPosition(
      playerPosition,
      player.team as PlayableTeamId
    );

    this.setState("catchPosition", adjustedPlayerPosition);

    const nearestDefender = MapReferee.getNearestPlayerToPosition(
      Room.game.players.getDefense(),
      adjustedPlayerPosition
    );

    // Can be null if there are no defensive players
    if (nearestDefender) {
      this.setState("nearestDefenderToCatch", nearestDefender);
    }

    this._updateStatsIfNotTwoPoint(quarterback.id, {
      passCompletions: { [mapSection]: 1 },
    });

    if (this.stateExists("curvePass")) {
      this._updateStatsIfNotTwoPoint(this.getQuarterback().id, {
        curvedPassCompletions: 1,
      });
    }

    this.setState("ballCaught");
    Chat.send(`${ICONS.Football} Pass caught!`);
    this.setBallCarrier(player);
  }

  protected _handleRun(playerContactObj: PlayerContact) {
    const { player, playerSpeed } = playerContactObj;

    // const isFumble = this._checkForFumble(playerContactObj);

    // if (isFumble)
    //   return this._handleFumble(playerContactObj, this._ballCarrier!);

    // return;

    Chat.send(`${ICONS.Running} Ball Ran!`);
    // this._giveRunnerSpeedBoost(player, playerSpeed);
    this._makeOffenseBouncy();

    this.setBallCarrier(player).setState("ballRan");
  }

  protected _handleIllegalTouch(ballContactObj: BallContact) {
    this._handlePenalty("illegalTouch", ballContactObj.player);
  }

  private _getAllOffsideOffenseAndMove() {
    const offsidePlayers = MapReferee.findAllTeamPlayerOffside(
      Room.game.players.getOffense(),
      Room.game.offenseTeamId,
      Room.game.down.getLOS().x
    );

    const fifteenYardsBehindLosX = new DistanceCalculator()
      .subtractByTeam(
        Room.game.down.getLOS().x,
        MAP_POINTS.YARD * 15,
        Room.game.offenseTeamId
      )
      .calculate();

    offsidePlayers.forEach((player) => {
      // Send the message they are offside
      Chat.send(
        `⚠️ You were offside (infront of the blue line), you have been moved 15 yards back.`,
        { id: player.id }
      );
      // Set their x value 15 yards behind LOS
      client.setPlayerDiscProperties(player.id, {
        x: fifteenYardsBehindLosX,
        xspeed: 0,
        yspeed: 0,
      });
    });
  }

  private _getAllOffsideDefenseAndMove() {
    const offsidePlayers = MapReferee.findAllTeamPlayerOffside(
      Room.game.players.getDefense(),
      Room.game.defenseTeamId,
      Room.game.down.getLOS().x
    );

    const fifteenYardsBehindLosX = new DistanceCalculator()
      .subtractByTeam(
        Room.game.down.getLOS().x,
        MAP_POINTS.YARD * 15,
        Room.game.defenseTeamId
      )
      .calculate();

    offsidePlayers.forEach((player) => {
      // Send the message they are offside
      Chat.send(
        `⚠️ You were offside (infront of the blue line), you have been moved 15 yards back.`,
        { id: player.id }
      );
      // Set their x value 15 yards behind LOS
      client.setPlayerDiscProperties(player.id, {
        x: fifteenYardsBehindLosX,
        xspeed: 0,
        yspeed: 0,
      });
    });
  }

  private _handleCurvePass(ballContactObj: BallContact) {
    // We have to determine if the players position is lower or higher than the ball, that way can set the right gravity
    // If player is passing up, set y gravity positive (ball curves down)
    // If player is passing down, set y gravity megative (ball curves up)

    const ballPosition = Ball.getPosition();

    const { playerPosition } = ballContactObj;

    const playerIsTouchingBottomOfBall = playerPosition.y > ballPosition.y;

    const CURVE_SHAPRNESS = 0.09;

    if (playerIsTouchingBottomOfBall)
      return Ball.setGravity({ y: CURVE_SHAPRNESS });
    return Ball.setGravity({ y: -CURVE_SHAPRNESS });
  }

  protected _handleBallContactQuarterback(ballContactObj: BallContact) {
    const { type } = ballContactObj;

    // QB tries to catch their own pass
    const qbContactAfterPass = this.stateExists("ballPassed");
    if (qbContactAfterPass) return;

    // QB touched the ball before the pass
    const qbTouchedBall = type === "touch";
    if (qbTouchedBall) return;

    // If he didnt touch, he kicked, meaning he passed
    this.setState("ballPassed");

    this._updateQBTimeAndDistanceMovedStat();

    this.setBallCarrier(null);

    if (this.stateExists("curvePass")) {
      this._handleCurvePass(ballContactObj);
    }
  }

  protected _handleBallContactDuringInterception(ballContactObj: BallContact) {
    // If anyone but the intercepting player touches the ball, reset play
    const interceptingPlayer = this.getState("interceptingPlayer");

    if (interceptingPlayer.id !== ballContactObj.player.id) {
      const touchedByOffenseOrDefense =
        interceptingPlayer.team === ballContactObj.player.team
          ? "Illegally touched by defense"
          : "Blocked by offense";
      return this.handleUnsuccessfulInterception(touchedByOffenseOrDefense);
    }

    // Check if the int was kicked yet or not
    const intKicked = this.stateExists("interceptionAttemptKicked");

    // Int kicker touches ball after it was kicked, its no good
    if (intKicked) {
      return this.handleUnsuccessfulInterception(
        "Illegally touched by defense"
      );
    }

    // He finally kicks it, meaning there is a legal int attempt
    if (ballContactObj.type === "kick")
      return this._handleInterceptionKick(ballContactObj);
  }

  protected _handleInterceptionKick(ballContactObj: BallContact) {
    this.setState("interceptionAttemptKicked");

    this.setState(
      "interceptionPlayerKickPosition",
      ballContactObj.playerPosition
    );
    Room.game.swapOffenseAndUpdatePlayers();

    const adjustedPlayerKickPosition = PreSetCalculators.adjustRawEndPosition(
      ballContactObj.playerPosition,
      Room.game.offenseTeamId
    );

    this._setStartingPosition({
      x: adjustedPlayerKickPosition.x,
      y: adjustedPlayerKickPosition.y,
    });

    this.setBallCarrier(ballContactObj.player);

    // In three seconds, check if the ball is headed towards being a fg or not
    setTimeout(() => {
      if (this.stateExists("interceptionRuling")) return;

      const { xspeed } = Ball.getSpeed();

      const ballPosition = Ball.getPosition();

      const ballPositionOnFirstTouch = this.getState(
        "interceptionBallPositionFirstTouch"
      );

      const isHeadedTowardsInt = MapReferee.checkIfBallIsHeadedInIntTrajectory(
        xspeed,
        ballPositionOnFirstTouch,
        ballPosition
      );

      if (isHeadedTowardsInt)
        return this.handleUnsuccessfulInterception("Missed");
    }, 3000);
  }

  protected _handleInterceptionAttempt(ballContactObj: BallContact) {
    // No ints on two point conversions
    if (this.stateExists("twoPointAttempt")) return;

    // Before we can handle it, lets make sure they are within bounds
    const isOutOfBoundsOnAttempt = MapReferee.checkIfPlayerOutOfBounds(
      ballContactObj.playerPosition
    );

    if (isOutOfBoundsOnAttempt)
      return this.handleUnsuccessfulInterception(
        "Out of bounds during attempt"
      );

    this.setState("interceptionAttempt");
    this.setState("interceptingPlayer", ballContactObj.player);
    this.setState("interceptionBallPositionFirstTouch", Ball.getPosition());

    if (ballContactObj.type === "kick")
      return this._handleInterceptionKick(ballContactObj);
  }

  // This method needs to be made public since it can be called by our event observer
  handleUnsuccessfulInterception(badIntReason: BadIntReasons) {
    this.setState("interceptionRuling");

    if (
      badIntReason === "Missed" ||
      badIntReason === "Drag on kick" ||
      badIntReason === "Out of bounds during attempt"
    ) {
      // Chat.send(`Interception unsuccessful: ${badIntReason}`);
    }

    // This means we swapped offense, so reswap again
    if (this.stateExists("interceptionAttemptKicked")) {
      Room.game.swapOffenseAndUpdatePlayers();
    }

    return this.endPlay({});
  }

  protected _handleSuccessfulInterception() {
    Chat.send(`${ICONS.Target} Pass Intercepted!`);

    const interceptingPlayer = this.getState("interceptingPlayer")!;

    this._updateStatsIfNotTwoPoint(interceptingPlayer.id, {
      interceptionsReceived: 1,
    });

    this._updateStatsIfNotTwoPoint(this._quarterback.id, {
      interceptionsThrown: 1,
    });

    this.setState("interceptionRuling");
    this.setState("ballIntercepted");

    const endPositionExists = this.stateExists("interceptionPlayerEndPosition");

    if (!endPositionExists) return;

    const rawEndPosition = this.getState("interceptionPlayerEndPosition");

    const { endPosition: adjustedEndPosition } =
      this._getPlayDataOffense(rawEndPosition);

    const { isSafety, isTouchback } =
      GameReferee.checkIfSafetyOrTouchbackPlayer(
        this.getState("interceptionPlayerKickPosition"),
        rawEndPosition,
        Room.game.offenseTeamId
      );

    if (isSafety) return this._handleSafety();
    if (isTouchback) return this._handleTouchback();

    return this.endPlay({ newLosX: adjustedEndPosition.x, setNewDown: true });
  }

  protected _handleInterceptionBallCarrierOutOfBounds(
    ballCarrierPosition: Position
  ) {
    // This method only runs when we dont have an end position yet

    // If the ruling on the int is good
    // And there isnt a saved position yet for this play
    // Then its a regular ballcarrier out of bounds
    if (this.stateExists("interceptionRuling")) {
      const { endPosition, yardAndHalfStr } =
        this._getPlayDataOffense(ballCarrierPosition);

      Chat.send(
        `${this._ballCarrier?.name} stepped out of bounds ${yardAndHalfStr}`
      );

      const { isSafety, isTouchback } =
        GameReferee.checkIfSafetyOrTouchbackPlayer(
          this.getState("interceptionPlayerKickPosition"),
          endPosition,
          Room.game.offenseTeamId
        );

      if (isSafety) return this.handleSafety();
      if (isTouchback) return this._handleTouchback();

      return this.endPlay({
        newLosX: endPosition.x,
        setNewDown: true,
      });
    }

    // Otherwise set that as the saved position, and now we dont run this method anymore
    this.setState("interceptionPlayerEndPosition", ballCarrierPosition);
  }

  protected _handleTackle(playerContact: PlayerContact) {
    const {
      endPosition,
      netYards,
      yardAndHalfStr,
      netYardsStr,
      yardsAfterCatch,
      yardsPassed,
    } = this._getPlayDataOffense(playerContact.ballCarrierPosition);

    this._updateStatsIfNotTwoPoint(playerContact.player.id, {
      tackles: 1,
    });

    // Check for sack
    const isSack =
      GameReferee.checkIfSack(
        playerContact.ballCarrierPosition,
        Room.game.down.getLOS().x,
        Room.game.offenseTeamId
      ) &&
      this.stateExists("ballRan") === false &&
      this.stateExists("ballCaught") === false;

    const isFumble = this._checkForFumble(playerContact);

    if (isFumble) this._handleFumble(playerContact, this._ballCarrier!);

    // No sacks on interceptions
    if (isSack && this.stateExists("ballIntercepted") === false) {
      Chat.send(
        `${ICONS.HandFingersSpread} ${playerContact.player.name} with the SACK!`
      );

      this._updateStatsIfNotTwoPoint(playerContact.player.id, {
        sacks: 1,
      });

      this._updateStatsIfNotTwoPoint(playerContact.player.id, {
        qbSacks: 1,
      });
    } else {
      Chat.send(
        `${ICONS.HandFingersSpread} Tackle ${yardAndHalfStr} | ${netYardsStr}`
      );
    }

    // Tackle on a run
    if (this.stateExists("ballRan")) {
      this._updateStatsIfNotTwoPoint(this._ballCarrier!.id, {
        rushingAttempts: 1,
        rushingYards: netYards,
      });

      // Tackle on a reception
    } else if (this.stateExists("ballCaught")) {
      const { mapSection } = this._getStatInfo(this.getState("catchPosition"));

      this._updateStatsIfNotTwoPoint(this._ballCarrier!.id, {
        receptions: { [mapSection]: 1 },
        receivingYards: { [mapSection]: netYards },
        receivingYardsAfterCatch: { [mapSection]: yardsAfterCatch },
      });

      if (this.stateExists("nearestDefenderToCatch")) {
        const nearestDefenerToCatch = this.getState("nearestDefenderToCatch");

        this._updateStatsIfNotTwoPoint(nearestDefenerToCatch.id, {
          yardsAllowed: { [mapSection]: netYards },
        });
      }

      this._updateStatsIfNotTwoPoint(this._quarterback!.id, {
        passYards: { [mapSection]: netYards },
        passYardsDistance: { [mapSection]: yardsPassed },
      });
    }

    // Allows us to reset the down
    if (this.stateExists("ballIntercepted")) {
      return this.endPlay({
        newLosX: endPosition.x,
        netYards,
        setNewDown: true,
      });
    }

    const startingPosition = this.stateExists("catchPosition")
      ? this.getState("catchPosition")
      : this._startingPosition;

    const { isSafety } = GameReferee.checkIfSafetyOrTouchbackPlayer(
      startingPosition,
      endPosition,
      Room.game.offenseTeamId
    );

    if (isSafety) return this.handleSafety();

    this.endPlay({
      newLosX: endPosition.x,
      netYards,
    });
  }

  protected _handleInterceptionTackle(playerContactObj: PlayerContact) {
    // If there was a ruling on if the int was good or not and it was successful, handle the tackle
    if (this.stateExists("interceptionRuling"))
      return this._handleTackle(playerContactObj);

    // If there hasn't been a ruling yet on the int, save the tackle position

    this.setState(
      "interceptionPlayerEndPosition",
      playerContactObj.playerPosition
    );
  }

  protected _handleRunTackle(playerContactObj: PlayerContact): void {
    // First tackle
    if (this.stateExists("runFirstTackler") === false) {
      this.setState("runFirstTackler", playerContactObj.player);
      Chat.send("First tackle");
      setTimeout(() => {
        this.setState("canSecondTackle");
      }, 500);
    }

    const isSamePlayedWhoInitiallyTackled =
      this.getState("runFirstTackler").id === playerContactObj.player.id;

    if (
      this.stateExists("canSecondTackle") === false &&
      isSamePlayedWhoInitiallyTackled
    )
      return;

    // Handle second tackle
    return this._handleTackle(playerContactObj);
  }

  // /**
  //  * Handles a touchdown after a two point conversion
  //  */
  private _handleTwoPointTouchdown() {
    Chat.send(`${ICONS.Fire} Two point conversion!`, {
      sound: 2,
    });
    // Room.game.clearState();
    // Add only one, since we add 7 not 6 after a TD
    this.scorePlay(1, Room.game.offenseTeamId, Room.game.defenseTeamId);
  }

  // /**
  //  * Handles unsuccessful two point conversion
  //  */
  private _handleFailedTwoPointConversion() {
    // Remove one point
    // Room.game.clearState();
    this.scorePlay(-1, Room.game.offenseTeamId, Room.game.defenseTeamId);
  }

  private _giveRunnerSpeedBoost(runner: PlayerObjFlat, speed: Speed) {
    console.log(speed);

    const isMovingDown = speed.y > 0;

    if (isMovingDown) {
      client.setPlayerDiscProperties(runner.id, { yspeed: 6 });
    } else {
      client.setPlayerDiscProperties(runner.id, { yspeed: -6 });
    }

    // if (runner.team === TEAMS.RED) {
    //   client.setPlayerDiscProperties(runner.id, { xspeed: 8 });
    // } else {
    //   client.setPlayerDiscProperties(runner.id, { xspeed: -8 });
    // }
  }

  /**
   * Makes the offense bouncy so they can block for the runner
   */
  private _makeOffenseBouncy() {
    const offensePlayers = Room.game.players.getOffense();

    offensePlayers.forEach((player) => {
      client.setPlayerDiscProperties(player.id, {
        bCoeff: 0.99,
        // damping: 0.55,
        invMass: 0.35,
      });
    });
  }

  /**
   * Updates two stats for the QB, time before pass and distance before pass
   */
  private _updateQBTimeAndDistanceMovedStat() {
    const { position } = getPlayerDiscProperties(this._quarterback.id)!;

    const initialPosition = Room.game.down.getSnapPosition();

    const distanceMovedBeforePassUnRounded = new DistanceCalculator()
      .calcDifference3D(position, initialPosition)
      .calculate();

    const distanceMovedBeforePass = round(distanceMovedBeforePassUnRounded, 1);

    const timeBeforePass = round(Room.game.getTime() - this.time, 1);

    this._updateStatsIfNotTwoPoint(this._quarterback.id, {
      distanceMovedBeforePassArr: [distanceMovedBeforePass],
      timeToPassArr: [timeBeforePass],
    });
  }

  /**
   * Handles regular touchdown
   */
  private _handleRegularTouchdown(endPosition: Position) {
    // Determine what kind of touchdown we have here
    // If the ball has been ran or if the qb ran the ball
    const { netYards, yardsPassed, yardsAfterCatch } =
      this._getPlayDataOffense(endPosition);

    if (
      this.stateExistsUnsafe("ballRan") ||
      this._ballCarrier?.id === this._quarterback.id
    ) {
      this._updateStatsIfNotTwoPoint(this._ballCarrier?.id!, {
        rushingAttempts: 1,
        rushingYards: netYards,
        touchdownsRushed: 1,
      });
    }
    if (this.stateExistsUnsafe("ballCaught")) {
      const catchPosition = this.getState("catchPosition");
      const { mapSection } = this._getStatInfo(catchPosition);

      this._updateStatsIfNotTwoPoint(this._ballCarrier?.id!, {
        receptions: { [mapSection]: 1 },
        receivingYards: { [mapSection]: netYards },
        receivingYardsAfterCatch: { [mapSection]: yardsAfterCatch },
        touchdownsReceived: 1,
      });

      if (this.stateExists("nearestDefenderToCatch")) {
        const nearestDefenerToCatch = this.getState("nearestDefenderToCatch");

        this._updateStatsIfNotTwoPoint(nearestDefenerToCatch.id, {
          yardsAllowed: { [mapSection]: netYards },
        });
      }

      this._updateStatsIfNotTwoPoint(this._quarterback?.id!, {
        passYards: { [mapSection]: netYards },
        passYardsDistance: { [mapSection]: yardsPassed },
        touchdownsThrown: 1,
      });
    }

    super.handleTouchdown(endPosition);
  }
}

class SnapValidatorPenalty<T extends PenaltyName> {
  penaltyName: T;
  player: PlayerObject;
  penaltyData: AdditionalPenaltyData;

  constructor(
    penaltyName: T,
    player: PlayerObject,
    penaltyData: AdditionalPenaltyData = {}
  ) {
    this.penaltyName = penaltyName;
    this.player = player;
    this.penaltyData = penaltyData;
  }
}

class SnapValidator {
  private _player: PlayerObject;
  private _playerPosition: Position;

  constructor(player: PlayerObject) {
    this._player = player;
    this._playerPosition = getPlayerDiscProperties(this._player.id)!.position;
  }

  private _checkSnapOutOfBounds(): never | void {
    const isOutOfBounds = MapReferee.checkIfPlayerOutOfBounds(
      this._playerPosition
    );

    if (isOutOfBounds)
      throw new SnapValidatorPenalty("snapOutOfBounds", this._player);
  }

  private _checkSnapWithinHashes(): never | void {
    const isWithinHash = MapReferee.checkIfWithinHash(
      this._playerPosition,
      MAP_POINTS.PLAYER_RADIUS
    );

    if (!isWithinHash)
      throw new SnapValidatorPenalty("snapOutOfHashes", this._player);
  }

  private _checkOffsideOffense(): never | void {
    const offsidePlayer = MapReferee.findTeamPlayerOffside(
      Room.game.players.getOffense(),
      Room.game.offenseTeamId,
      Room.game.down.getLOS().x
    );

    if (offsidePlayer)
      throw new SnapValidatorPenalty("offsidesOffense", offsidePlayer);
  }

  private _checkOffsideDefense(): never | void {
    const offsidePlayer = MapReferee.findTeamPlayerOffside(
      Room.game.players.getDefense(),
      Room.game.defenseTeamId,
      Room.game.down.getLOS().x
    );

    if (offsidePlayer)
      throw new SnapValidatorPenalty("offsidesDefense", offsidePlayer);
  }

  validate() {
    try {
      this._checkSnapWithinHashes();
      this._checkSnapOutOfBounds();
      // this._checkOffsideOffense();
      // this._checkOffsideDefense();
    } catch (e) {
      if (e instanceof SnapValidatorPenalty) {
        const { penaltyName, player, penaltyData } =
          e as SnapValidatorPenalty<any>;

        return {
          valid: false,
          penaltyName: penaltyName,
          player: player,
          penaltyData: penaltyData,
        };
      }

      console.log(e);
    }

    return {
      valid: true,
    };
  }
}
