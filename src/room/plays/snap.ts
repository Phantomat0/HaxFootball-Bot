import Room from "..";
import BallContact from "../classes/BallContact";
import PlayerContact from "../classes/PlayerContact";
import { PlayerObject, PlayerObjFlat, Position } from "../HBClient";
import Chat from "../roomStructures/Chat";
import Ball from "../structures/Ball";
import GameReferee from "../structures/GameReferee";
import MapReferee from "../structures/MapReferee";
import MessageFormatter from "../structures/MessageFormatter";
import PreSetCalculators from "../structures/PreSetCalculators";
import ICONS from "../utils/Icons";
import MapSectionFinder, { MapSectionName } from "../utils/MapSectionFinder";
import SnapEvents from "./play_events/Snap.events";

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
  private readonly BLITZ_TIME_SECONDS: number = 12;
  constructor(time: number, quarterback: PlayerObject) {
    super(time);
    this._quarterback = quarterback;
    this._ballCarrier = quarterback;
  }

  private _blitzTimer() {
    this._blitzClockTime++;
    Chat.send(`${this._blitzClockTime}`);
    if (this._blitzClockTime >= this.BLITZ_TIME_SECONDS) {
      this.setState("canBlitz");
      return this._stopBlitzClock();
    }
  }

  getQuarterback() {
    return this._quarterback;
  }

  protected _startBlitzClock() {
    this._blitzClock = setInterval(this._blitzTimer.bind(this), 1000);
  }

  private _stopBlitzClock() {
    if (this._blitzClock === null) return;
    clearInterval(this._blitzClock);
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

    Room.game.stats.updatePlayerStat(quarterback.id, {
      passAttempts: { [mapSection]: 1 },
    });

    const isOutOfBounds = MapReferee.checkIfPlayerOutOfBounds(playerPosition);

    if (isOutOfBounds) {
      Chat.send(`${ICONS.DoNotEnter} Pass Incomplete, caught out of bounds`);
      return this.endPlay({});
    }

    /// Its a legal catch

    const adjustedPlayerPosition =
      PreSetCalculators.adjustPlayerPositionFrontAfterPlay(
        playerPosition,
        player.team
      );

    this.setState("catchPosition", adjustedPlayerPosition);

    Room.game.stats.updatePlayerStat(quarterback.id, {
      passCompletions: { [mapSection]: 1 },
    });

    this.setState("ballCaught");
    Chat.send(`${ICONS.Football} Pass caught!`);
    this.setBallCarrier(player);
  }

  protected _handleRun(playerContactObj: PlayerContact) {
    const { player } = playerContactObj;

    Chat.send(`${ICONS.Running} Ball Ran!`);

    this.setBallCarrier(player).setState("ballRan");
  }

  protected _handleIllegalTouch(ballContactObj: BallContact) {
    this._handlePenalty("illegalTouch", ballContactObj.player);
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
    return this.setBallCarrier(null);
  }

  protected _handleBallContactOffense(ballContactObj: BallContact) {
    if (this.stateExists("ballDeflected"))
      return this._handleBallContactDuringInterception(ballContactObj);

    const { player } = ballContactObj;
    const { id } = player;

    // If contact was made by QB, handle it seperately
    const isQBContact = id === this.getQuarterback().id;
    if (isQBContact) return this._handleBallContactQuarterback(ballContactObj);

    // Receiver touched but there wasnt a pass yet
    const touchButNoQbPass = this.stateExists("ballPassed") === false;
    if (touchButNoQbPass) return this._handleIllegalTouch(ballContactObj);

    // Has to be a catch
    this._handleCatch(ballContactObj);
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

  protected _handleBallContactDefense(ballContactObj: BallContact) {
    // If the ball wasn't passed yet, ball must have been blitzed
    if (!this.stateExists("ballPassed")) return this.setState("ballBlitzed");

    const { mapSection } = this._getStatInfo(ballContactObj.playerPosition);

    Room.game.stats.updatePlayerStat(ballContactObj.player.id, {
      passDeflections: { [mapSection]: 1 },
    });

    Room.game.stats.updatePlayerStat(this._quarterback.id, {
      passAttempts: { [mapSection]: 1 },
    });

    Chat.send(`${ICONS.DoNotEnter} Incomplete - Pass Deflected`);
    this.setState("ballDeflected");

    this._handleInterceptionAttempt(ballContactObj);
  }

  // This method needs to be made public since it can be called by our event observer
  handleUnsuccessfulInterception(badIntReason: BadIntReasons) {
    this.setState("interceptionRuling");

    Chat.send(`Interception unsuccessful: ${badIntReason}`);
    // This means we swapped offense, so reswap again
    if (this.stateExists("interceptionAttemptKicked")) {
      Room.game.swapOffenseAndUpdatePlayers();
    }

    return this.endPlay({});
  }

  protected _handleSuccessfulInterception() {
    Chat.send(`${ICONS.Target} Pass Intercepted!`);

    const interceptingPlayer = this.getState("interceptingPlayer")!;

    Room.game.stats.updatePlayerStat(interceptingPlayer.id, {
      interceptionsReceived: 1,
    });

    Room.game.stats.updatePlayerStat(this._quarterback.id, {
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

    if (isSafety) return this.handleSafety();
    if (isTouchback) return this.handleTouchback();

    return this.endPlay({ newLosX: adjustedEndPosition.x, resetDown: true });
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
          ballCarrierPosition,
          Room.game.offenseTeamId
        );

      if (isSafety) return this.handleSafety();
      if (isTouchback) return this.handleTouchback();

      return this.endPlay({
        newLosX: endPosition.x,
        resetDown: true,
      });
    }

    // Otherwise set that as the saved position, and now we dont run this method anymore
    this.setState("interceptionPlayerEndPosition", ballCarrierPosition);
  }

  protected _handleTackle(playerContact: PlayerContact) {
    const { endPosition, netYards, yardAndHalfStr } = this._getPlayDataOffense(
      playerContact.ballCarrierPosition
    );

    Chat.send(`${ICONS.HandFingersSpread} Tackle ${yardAndHalfStr}`);

    Room.game.stats.updatePlayerStat(playerContact.player.id, {
      tackles: 1,
    });

    // Check for sack
    const isSack =
      GameReferee.checkIfSack(
        playerContact.ballCarrierPosition,
        Room.game.down.getLOS().x,
        Room.game.offenseTeamId
      ) && this.stateExists("ballRan") === false;

    // No sacks on interceptions
    if (isSack && this.stateExists("ballIntercepted") === false) {
      Chat.send(
        `${ICONS.HandFingersSpread} ${playerContact.player.name} with the SACK!`
      );

      Room.game.stats.updatePlayerStat(playerContact.player.id, {
        sacks: 1,
      });

      Room.game.stats.updatePlayerStat(playerContact.player.id, {
        qbSacks: 1,
      });
    }

    // Tackle on a run
    if (this.stateExists("ballRan")) {
      Room.game.stats.updatePlayerStat(this._ballCarrier!.id, {
        rushingAttempts: 1,
        rushingYards: netYards,
      });

      // Tackle on a reception
    } else if (this.stateExists("ballCaught")) {
      const { mapSection } = this._getStatInfo(this.getState("catchPosition"));

      Room.game.stats.updatePlayerStat(this._ballCarrier!.id, {
        receptions: { [mapSection]: 1 },
        receivingYards: { [mapSection]: netYards },
      });

      Room.game.stats.updatePlayerStat(this._quarterback!.id, {
        passYards: { [mapSection]: netYards },
      });
    }

    // Allows us to reset the down
    if (this.stateExists("ballIntercepted")) {
      return this.endPlay({
        newLosX: endPosition.x,
        netYards,
        resetDown: true,
      });
    }

    const catchPosition = this.stateExists("catchPosition")
      ? this.getState("catchPosition")
      : null;

    const { isSafety } = GameReferee.checkIfSafetyOrTouchbackPlayer(
      catchPosition,
      playerContact.ballCarrierPosition,
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

    const { yardAndHalfStr } = this._getPlayDataOffense(
      playerContactObj.playerPosition
    );

    // If there hasn't been a ruling yet on the int, save the tackle position
    Chat.send(`${ICONS.HandFingersSpread} Tackle ${yardAndHalfStr}`);

    this.setState(
      "interceptionPlayerEndPosition",
      playerContactObj.playerPosition
    );
  }

  // /**
  //  * Handles a touchdown after a two point conversion
  //  */
  private _handleTwoPointTouchdown() {
    Room.game.addScore(Room.game.offenseTeamId, 7);
    Ball.score(Room.game.defenseTeamId);
  }

  /**
   * Handles regular touchdown
   */
  private _handleRegularTouchdown(endPosition: Position) {
    const { netYards } = this._getPlayDataOffense(endPosition);
    Chat.send(`${ICONS.Fire} TOUCHDOWN!`);
    // Determine what kind of touchdown we have here
    // If the ball has been ran or if the qb ran the ball
    if (
      this.stateExistsUnsafe("ballRan") ||
      this._ballCarrier?.id === this._quarterback.id
    ) {
      Room.game.stats.updatePlayerStat(this._ballCarrier?.id!, {
        rushingAttempts: 1,
        rushingYards: netYards,
        touchdownsRushed: 1,
      });
    }
    if (this.stateExistsUnsafe("ballCaught")) {
      const catchPosition = this.getState("catchPosition");
      const { mapSection } = this._getStatInfo(catchPosition);
      Room.game.stats.updatePlayerStat(this._ballCarrier?.id!, {
        receptions: { [mapSection]: 1 },
        receivingYards: { [mapSection]: netYards },
        touchdownsRushed: 1,
      });

      Room.game.stats.updatePlayerStat(this._quarterback?.id!, {
        passYards: { [mapSection]: netYards },
        touchdownsThrown: 1,
      });
    }

    this.scorePlay(7, Room.game.offenseTeamId, Room.game.defenseTeamId);
    // Allow for a two point attempt
    Room.game.setState("canTwoPoint");
  }

  /**
   * Handles an auto touchdown after three redzone penalties
   */
  handleAutoTouchdown() {
    Chat.send(`${ICONS.Fire} Automatic Touchdown! - 3/3 Penalties`);
    this.scorePlay(7, Room.game.offenseTeamId, Room.game.defenseTeamId);
  }

  handleTouchdown(position: Position) {
    this._setLivePlay(false);
    // First we need to get the type of touchdown, then handle
    if (this.stateExistsUnsafe("twoPointAttempt"))
      return this._handleTwoPointTouchdown();
    return this._handleRegularTouchdown(position);
  }

  onKickDrag(player: PlayerObjFlat | null) {
    this._handlePenalty("snapDrag", player!);
  }

  handleIllegalCrossOffense(player: PlayerObjFlat) {
    this._handlePenalty("illegalLosCross", player);
  }

  handleIllegalBlitz(player: PlayerObject) {
    this._handlePenalty("illegalBlitz", player, { time: this._blitzClockTime });
  }

  cleanUp() {
    this._stopBlitzClock();
  }
}
