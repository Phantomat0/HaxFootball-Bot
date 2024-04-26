import BallContact from "../classes/BallContact";
import PlayerContact from "../classes/PlayerContact";
import {
  PlayableTeamId,
  PlayerObject,
  PlayerObjFlat,
  Position,
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
import COLORS from "../utils/colors";

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

    if (Room.game.getTightEnd() === player?.id)
      throw new GameCommandError(
        "You cannot snap the ball as a Tight End",
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
    Room.game.down.setMostRecentQuarterback(this._quarterback);
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
    const fieldedPlayersNoQb = Room.game.players
      .getFielded()
      .filter((player) => player.id !== this._quarterback.id);

    const { isCrowding, crowdingData, crowder } =
      this.crowdChecker.checkPlayersInCrowdBox(
        fieldedPlayersNoQb,
        Room.game.getTime()
      );

    if (isCrowding) {
      if (crowdingData!.wasAlone)
        return this._handlePenalty("crowdAbuse", crowder!);
      return this._handlePenalty("crowding", crowder!);
    }

    return null;
  }

  protected async _handlePenalty<T extends PenaltyName>(
    penaltyName: T,
    player: PlayerObjFlat,
    penaltyData: AdditionalPenaltyData = {}
  ): Promise<void> {
    // If a snap penalty occurs, playData will still be null, so we just need to load the data

    // We have to check the room and play state, since play state may not be sent on a snap penalty
    const isTwoPoint =
      this.stateExists("twoPointAttempt") ||
      Room.game.stateExists("twoPointAttempt");

    if (isTwoPoint) {
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

      return this._handleTwoPointTouchdown(null);
    }

    // Show the crowd box and send the crowding explanation message
    if (penaltyName === "crowding" || penaltyName === "crowdAbuse") {
      this._setLivePlay(false);
      Chat.sendWarning(
        "You cannot stand inside the red box for more than 3 seconds without an offensive player being present.",
        { id: player.id, color: COLORS.LightRed }
      );
      this.crowdChecker.drawCrowdBoxLines();
      setTimeout(
        this.crowdChecker.eraseCrowdBoxLines.bind(this.crowdChecker),
        2000
      );
    }

    super._handlePenalty(penaltyName, player, penaltyData);
  }

  endPlay(endPlayData: EndPlayData) {
    if (this.stateExists("twoPointAttempt")) {
      this._setLivePlay(false);
      // Endplay will only run when we didn't score a touchdown, so means unsuccessful two point
      return this._handleFailedTwoPointConversion();
    }
    super.endPlay(endPlayData);
  }

  /**
   * Have to redeclare since we only add one point to defensive team for a safety during a two point
   */
  protected _handleSafety() {
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
    // Make sure the player cant score a touchdown if he was made the ballCarrier during an int
    if (
      this.stateExists("interceptionAttempt") &&
      this.stateExists("ballIntercepted") === false
    )
      return;

    // First we need to get the type of touchdown, then handle
    if (this.stateExistsUnsafe("twoPointAttempt"))
      return this._handleTwoPointTouchdown(position);
    return this._handleRegularTouchdown(position);
  }

  handleIllegalCrossOffense(player: PlayerObjFlat) {
    this._handlePenalty("illegalLosCross", player);
  }

  handleIllegalBlitz(player: PlayerObject): any {
    // Check if player was pushed
    const pushingPlayer = this._checkIfPlayerWasPushedToIllegalBlitz(player);

    if (pushingPlayer) return this._handlePenalty("illegalPush", pushingPlayer);

    // So we don't have "0" seconds
    this._handlePenalty("illegalBlitz", player, {
      time: this._blitzClockTime,
    });
  }

  handleBallInFrontOfLOS() {
    this._handlePenalty("illegalPass", this._quarterback);
  }

  handleQuarterbackLOSCross(
    qbOrKicker: ReturnType<InstanceType<typeof Snap>["getBallCarrier"]>
  ) {
    // If he is allowed to cross the LOS, allow him, and set that state
    if (
      this.stateExists("lineBlitzed") ||
      qbOrKicker.id !== this._quarterback.id
    ) {
      this.setState("qbRunPastLOS");
      return;
    }

    this.handleIllegalCrossOffense(qbOrKicker);
  }

  handleDefenseLineBlitz() {
    this.setState("lineBlitzed");
    if (this._ballCarrier)
      client.setPlayerAvatar(this._ballCarrier.id, ICONS.Football);
  }

  protected _updateStatsIfNotTwoPoint(
    playerId: PlayerObject["id"],
    statsQuery: Partial<PlayerStatQuery>
  ) {
    if (this.stateExists("twoPointAttempt")) return;
    Room.game.stats.updatePlayerStat(playerId, statsQuery);
  }

  protected _startBlitzClock() {
    this._blitzClock = setInterval(this._blitzTimerInterval.bind(this), 1000);
  }

  /**
   *
   * Check if the offside defensive player was pushed by the offense across the LOS
   * This will return the closest defensive player pushing or null if it wasn't a push
   */
  private _checkIfPlayerWasPushedToIllegalBlitz(offsidePlayer: PlayerObject) {
    const offsidePlayerPosition = getPlayerDiscProperties(
      offsidePlayer.id
    )!.position;

    // Find an offensive player that is touching the offside player, and that they were in front of him

    const offensePlayersSortedByDistanceToOffsidePlayer = Room.game.players
      .getOffense()
      .map((player) => {
        const discProps = getPlayerDiscProperties(player.id)!;

        return {
          player: player,
          ...discProps,
          distanceToOffsidePlayer: new DistanceCalculator()
            .calcDifference3D(discProps.position, offsidePlayerPosition)
            .calculate(),
        };
      })
      .sort((a, b) => b.distanceToOffsidePlayer - a.distanceToOffsidePlayer);

    const defensivePlayerTouchingOffsidePlayer =
      offensePlayersSortedByDistanceToOffsidePlayer.find((player) => {
        const { distanceToOffsidePlayer, radius, position } = player;

        const isTouching = distanceToOffsidePlayer < radius * 2 + 2;
        const isInFront = MapReferee.checkIfInFront(
          position.x,
          offsidePlayerPosition.x,
          Room.game.offenseTeamId
        );

        return isTouching && isInFront;
      });

    return defensivePlayerTouchingOffsidePlayer
      ? defensivePlayerTouchingOffsidePlayer.player
      : null;
  }

  private _blitzTimerInterval() {
    this._blitzClockTime++;
    if (this._blitzClockTime >= this.BLITZ_TIME_SECONDS) {
      if (this.stateExists("canBlitz") === false) this.setState("canBlitz");
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
      this._stopBallMoveBlitzClock();

      const passAlreadyDead =
        this.stateExists("lineBlitzed") ||
        this.stateExists("ballPassed") ||
        this.stateExists("ballRan");

      if (passAlreadyDead) return;

      this.setState("canBlitz");

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
      Chat.send(`${ICONS.DoNotEnter} Incomplete - Caught out of bounds`);
      Room.game.setLastPlayEndPosition(ballContactObj.playerPosition);
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
      this.setState("nearestDefenderToCatch", nearestDefender.player);
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
    const { player } = playerContactObj;

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
        `⚠️ You were offside (in front of the blue line), you have been moved 15 yards back.`,
        { id: player.id }
      );

      const isTightEnd = Room.game.checkIfPlayerIsTightEnd(player.id);
      if (isTightEnd) {
        const tightEndPosition = client.getPlayerDiscProperties(player.id)!;
        return Room.game.down.setTightEndPosition(player.id, {
          x: fifteenYardsBehindLosX,
          y: tightEndPosition.y,
        });
      }

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
        `⚠️ You were offside (in front of the blue line), you have been moved 15 yards back.`,
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
    // If player is passing down, set y gravity negative (ball curves up)

    const ballPosition = Ball.getPosition();

    const { playerPosition } = ballContactObj;

    const playerIsTouchingBottomOfBall = playerPosition.y > ballPosition.y;

    const CURVE_SHARPNESS = 0.09;

    if (playerIsTouchingBottomOfBall)
      return Ball.setGravity({ y: CURVE_SHARPNESS });
    return Ball.setGravity({ y: -CURVE_SHARPNESS });
  }

  protected _handleBallContactQuarterback(ballContactObj: BallContact) {
    const { type } = ballContactObj;

    // QB tries to catch their own pass
    const qbContactAfterPass = this.stateExists("ballPassed");
    if (qbContactAfterPass) return;

    // QB touched the ball before the pass
    const qbTouchedBall = type === "touch";
    if (qbTouchedBall) return;

    // If he didn't touch, he kicked, meaning he passed
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

    if (interceptingPlayer.id !== ballContactObj.player.id)
      return this.handleUnsuccessfulInterception();

    // Check if the int was kicked yet or not
    const intKicked = this.stateExists("interceptionAttemptKicked");

    // Int kicker touches ball after it was kicked, its no good
    if (intKicked) return this.handleUnsuccessfulInterception();

    // He finally kicks it, meaning there is a legal int attempt
    if (ballContactObj.type === "kick")
      return this._handleInterceptionKick(ballContactObj);
  }

  protected _handleInterceptionKick(ballContactObj: BallContact) {
    this.setState("interceptionAttemptKicked");

    Ball.setProperties({ damping: 0.992 });

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

    this.setBallCarrier(ballContactObj.player, false);

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

      if (isHeadedTowardsInt) return this.handleUnsuccessfulInterception();
    }, 3000);
  }

  protected _handleInterceptionAttempt(ballContactObj: BallContact) {
    // Before we can handle it, lets make sure they are within bounds
    const isOutOfBoundsOnAttempt = MapReferee.checkIfPlayerOutOfBounds(
      ballContactObj.playerPosition
    );

    if (isOutOfBoundsOnAttempt) return this.handleUnsuccessfulInterception();

    this.setState("interceptionAttempt");
    this.setState("interceptingPlayer", ballContactObj.player);
    this.setState("interceptionBallPositionFirstTouch", Ball.getPosition());

    if (ballContactObj.type === "kick")
      return this._handleInterceptionKick(ballContactObj);
  }

  // This method needs to be made public since it can be called by our event observer
  handleUnsuccessfulInterception() {
    this.setState("interceptionRuling");

    // This means we swapped offense, so reswap again
    if (this.stateExists("interceptionAttemptKicked")) {
      Room.game.swapOffenseAndUpdatePlayers();
    }

    return this.endPlay({});
  }

  protected _handleRunTackle(playerContactObj: PlayerContact): void {
    // First tackle
    const isFirstTackle = this.stateExists("runFirstTackler") === false;

    if (isFirstTackle) {
      this.setState("runFirstTackler", playerContactObj.player);
      Chat.send("First tackle");

      setTimeout(() => {
        this.setState("canSecondTackle");
      }, 500);
      return;
    }

    // Second Tackle
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

  private _handleRunTackleStats(playerContactObj: PlayerContact) {
    const { netYards } = this._getPlayDataOffense(
      playerContactObj.ballCarrierPosition
    );

    // Update Tackles
    this._updateStatsIfNotTwoPoint(playerContactObj.player.id, {
      tackles: 0.5,
    });

    const firstTackler = this.getState("runFirstTackler");

    this._updateStatsIfNotTwoPoint(firstTackler.id, {
      tackles: 0.5,
    });

    // Update rushing stats
    this._updateStatsIfNotTwoPoint(this._ballCarrier!.id, {
      rushingAttempts: 1,
      rushingYards: netYards,
    });
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

    // If there is no endposition, that means he is still running, so give him the football emoji
    if (!endPositionExists)
      return client.setPlayerAvatar(interceptingPlayer.id, ICONS.Football);

    const rawEndPosition = this.getState("interceptionPlayerEndPosition");

    const { endPosition: adjustedEndPosition } =
      this._getPlayDataOffense(rawEndPosition);

    const { isSafety, isTouchback } =
      GameReferee.checkIfSafetyOrTouchbackPlayer(
        this.getState("interceptionPlayerKickPosition"),
        rawEndPosition,
        Room.game.offenseTeamId
      );

    // No safeties on interceptions
    // if (isSafety) return this._handleSafety();
    if (isSafety || isTouchback) return this._handleTouchback();

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
        `${this._ballCarrier?.name.trim()} stepped out of bounds ${yardAndHalfStr}`
      );

      const { isSafety, isTouchback } =
        GameReferee.checkIfSafetyOrTouchbackPlayer(
          this.getState("interceptionPlayerKickPosition"),
          ballCarrierPosition,
          Room.game.offenseTeamId
        );

      // No safeties on interceptions
      if (isSafety || isTouchback) return this._handleTouchback();
      // if (isTouchback) return this._handleTouchback();

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

    // const isFumble = this._checkForFumble(playerContact);
    // if (isFumble) this._handleFumble(playerContact, this._ballCarrier!);

    // Check for sack
    const isSack =
      GameReferee.checkIfSack(
        playerContact.ballCarrierPosition,
        Room.game.down.getLOS().x,
        Room.game.offenseTeamId
      ) &&
      this.stateExists("ballRan") === false &&
      this.stateExists("ballCaught") === false;

    // No sacks on interceptions
    if (isSack && this.stateExists("ballIntercepted") === false) {
      Chat.send(
        `${
          ICONS.HandFingersSpread
        } ${playerContact.player.name.trim()} with the SACK!`
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

    // Tackles on runs are dealt differently, since there can be half tackles
    if (this.stateExists("ballRan")) {
      this._handleRunTackleStats(playerContact);
    } else {
      this._updateStatsIfNotTwoPoint(playerContact.player.id, {
        tackles: 1,
      });
    }

    // Tackle on a QB run
    if (this._ballCarrier!.id === this._quarterback.id) {
      this._updateStatsIfNotTwoPoint(this._ballCarrier!.id, {
        rushingAttempts: 1,
        rushingYards: netYards,
      });
    }

    // Tackle on a reception
    if (this.stateExists("ballCaught")) {
      const { mapSection } = this._getStatInfo(this.getState("catchPosition"));

      this._updateStatsIfNotTwoPoint(this._ballCarrier!.id, {
        receptions: { [mapSection]: 1 },
        receivingYards: { [mapSection]: netYards },
        receivingYardsAfterCatch: { [mapSection]: yardsAfterCatch },
      });

      if (this.stateExists("nearestDefenderToCatch")) {
        const nearestDefenderToCatch = this.getState("nearestDefenderToCatch");

        this._updateStatsIfNotTwoPoint(nearestDefenderToCatch.id, {
          yardsAllowed: { [mapSection]: netYards },
        });
      }

      this._updateStatsIfNotTwoPoint(this._quarterback!.id, {
        passYards: { [mapSection]: netYards },
        passYardsDistance: { [mapSection]: yardsPassed },
      });
    }

    const startingPosition = this.stateExists("catchPosition")
      ? this.getState("catchPosition")
      : this._startingPosition;

    if (this.stateExists("ballIntercepted")) {
      const { isSafety, isTouchback } =
        GameReferee.checkIfSafetyOrTouchbackPlayer(
          this.getState("interceptionBallPositionFirstTouch"),
          playerContact.ballCarrierPosition,
          Room.game.offenseTeamId
        );

      // No safeties on interceptions
      if (isSafety || isTouchback) return this._handleTouchback();
      // if (isTouchback) return this._handleTouchback();
    } else {
      const { isSafety } = GameReferee.checkIfSafetyOrTouchbackPlayer(
        startingPosition,
        playerContact.ballCarrierPosition,
        Room.game.offenseTeamId
      );

      if (isSafety) return this._handleSafety();
    }

    // Set new down if interception
    this.endPlay({
      newLosX: endPosition.x,
      netYards,
      setNewDown: this.stateExists("ballIntercepted"),
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

  // /**
  //  * Handles a touchdown after a two point conversion
  //  */
  private _handleTwoPointTouchdown(endPosition: Position | null) {
    Chat.send(`${ICONS.Fire} Two point conversion!`, {
      sound: 2,
    });

    Room.game.setState("twoPointAttempt");

    // Add only one, since we add 7 not 6 after a TD
    this.scorePlay(1, Room.game.offenseTeamId, Room.game.defenseTeamId);
  }

  // /**
  //  * Handles unsuccessful two point conversion
  //  */
  protected _handleFailedTwoPointConversion() {
    Chat.send(`${ICONS.X} Failed Two Point Conversion`);
    // Remove one point
    this.scorePlay(-1, Room.game.offenseTeamId, Room.game.defenseTeamId);
  }

  // private _giveRunnerSpeedBoost(runner: PlayerObjFlat, speed: Speed) {
  //   console.log(speed);

  //   const isMovingDown = speed.y > 0;

  //   if (isMovingDown) {
  //     client.setPlayerDiscProperties(runner.id, { yspeed: 6 });
  //   } else {
  //     client.setPlayerDiscProperties(runner.id, { yspeed: -6 });
  //   }

  //   // if (runner.team === TEAMS.RED) {
  //   //   client.setPlayerDiscProperties(runner.id, { xspeed: 8 });
  //   // } else {
  //   //   client.setPlayerDiscProperties(runner.id, { xspeed: -8 });
  //   // }
  // }

  /**
   * Makes the offense bouncy so they can block for the runner
   */
  private _makeOffenseBouncy() {
    const offensePlayers = Room.game.players.getOffense();

    offensePlayers.forEach((player) => {
      client.setPlayerDiscProperties(player.id, {
        bCoeff: 0.99,
        // damping: 0.55,
        invMass: 0.55,
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

    const distanceMovedBeforePass = round(
      distanceMovedBeforePassUnRounded - MAP_POINTS.PLAYER_RADIUS,
      1
    );

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

  private _checkQBOnside(): never | void {
    const qbIsOffside = MapReferee.findTeamPlayerOffside(
      [this._player],
      Room.game.offenseTeamId,
      Room.game.down.getLOS().x
    );

    if (qbIsOffside)
      throw new SnapValidatorPenalty("offsidesOffense", this._player);
  }

  // private _checkOffsideOffense(): never | void {
  //   const offsidePlayer = MapReferee.findTeamPlayerOffside(
  //     Room.game.players.getOffense(),
  //     Room.game.offenseTeamId,
  //     Room.game.down.getLOS().x
  //   );

  //   if (offsidePlayer)
  //     throw new SnapValidatorPenalty("offsidesOffense", offsidePlayer);
  // }

  // private _checkOffsideDefense(): never | void {
  //   const offsidePlayer = MapReferee.findTeamPlayerOffside(
  //     Room.game.players.getDefense(),
  //     Room.game.defenseTeamId,
  //     Room.game.down.getLOS().x
  //   );

  //   if (offsidePlayer)
  //     throw new SnapValidatorPenalty("offsidesDefense", offsidePlayer);
  // }
  validate() {
    try {
      this._checkSnapWithinHashes();
      this._checkSnapOutOfBounds();
      this._checkQBOnside();
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
