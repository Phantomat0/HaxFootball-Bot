import Room from "..";
import BallContact from "../classes/BallContact";
import PlayerContact from "../classes/PlayerContact";
import { PlayerObject, Position } from "../HBClient";
import Chat from "../roomStructures/Chat";
import Ball from "../structures/Ball";
import GameReferee from "../structures/GameReferee";
import MapReferee from "../structures/MapReferee";
import PreSetCalculators from "../structures/PreSetCalculators";
import MapSectionFinder, { MapSectionName } from "../utils/MapSectionFinder";
import SnapEvents from "./play_events/Snap.events";

// CASES
// 1. Pass out of bounds
// 2. Catch
// 3. Pass Deflection
// 4. Interception
// 5. Run
// 6. Illegal touch offense
// 7. Illegal blitz defebse
// 8. Ball blitzed defense

export type BadIntReasons =
  | "Blocked by offense"
  | "Illegally touched by defense"
  | "Missed"
  | "Drag on kick"
  | "Out of bounds during attempt"
  | "Ball out of bounds";

export default class Snap extends SnapEvents {
  private _quarterback: PlayerObject;
  constructor(time: number, quarterback: PlayerObject) {
    super(time);
    this._quarterback = quarterback;
    this._ballCarrier = quarterback;
  }

  getQuarterback() {
    return this._quarterback;
  }

  protected _updateStats() {}

  protected _getStatInfo(endPosition: Position): {
    quarterback: PlayerObject;
    mapSection: MapSectionName;
  } {
    const losX = Room.game.down.getLOS().x;
    const mapSection = new MapSectionFinder().getSectionName(endPosition, losX);
    const quarterback = this.getQuarterback();

    return {
      quarterback,
      mapSection,
    };
  }

  protected _handleCatch(ballContactObj: BallContact) {
    const { player, playerPosition } = ballContactObj;
    const { name } = player;

    const { mapSection, quarterback } = this._getStatInfo(playerPosition);

    Room.game.stats.updatePlayerStat(quarterback.id, {
      passAttempts: { [mapSection]: 1 },
    });

    const isOutOfBounds = MapReferee.checkIfPlayerOutOfBounds(playerPosition);

    if (isOutOfBounds) {
      Chat.send(`Pass Incomplete, caught out of bounds`);
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
    Chat.send(`Pass caught by ${name}`);
    this.setBallCarrier(player);
  }

  protected _handleRun(playerContactObj: PlayerContact) {
    const { player } = playerContactObj;

    Chat.send("RUN");

    // sendPlayMessage({ type: PLAY_TYPES.RUN, playerName: player.name });

    this.setBallCarrier(player).setState("ballRan");
  }

  protected _handleIllegalTouch(ballContactObj: BallContact) {
    Chat.send("ILLEGAL TOUCH");

    this._setLivePlay(false);
  }

  protected _handleBallContactQuarterback(ballContactObj: BallContact) {
    const { type } = ballContactObj;

    // QB tries to catch their own pass
    const qbContactAfterPass = this.getState("ballPassed");
    if (qbContactAfterPass) return;

    // QB touched the ball before the pass
    const qbTouchedBall = type === "touch";
    if (qbTouchedBall) return;

    // If he didnt touch, he kicked, meaning he passed
    this.setState("ballPassed");
    return this.setBallCarrier(null);
  }

  protected _handleBallContactOffense(ballContactObj: BallContact) {
    if (this.getState("ballDeflected"))
      return this._handleBallContactDuringInterception(ballContactObj);

    const { player } = ballContactObj;
    const { id } = player;

    // If contact was made by QB, handle it seperately
    const isQBContact = id === this.getQuarterback().id;
    if (isQBContact) return this._handleBallContactQuarterback(ballContactObj);

    // Receiver touched but there wasnt a pass yet
    const touchButNoQbPass = this.getState("ballPassed") === null;
    if (touchButNoQbPass) return this._handleIllegalTouch(ballContactObj);

    // Has to be a catch
    this._handleCatch(ballContactObj);
  }

  protected _handleBallContactDuringInterception(ballContactObj: BallContact) {
    // If anyone but the intercepting player touches the ball, reset play
    const interceptingPlayer = this.getState("interceptingPlayer");
    if (!interceptingPlayer) throw Error("No intercepting player found");

    if (interceptingPlayer.id !== ballContactObj.player.id) {
      const touchedByOffenseOrDefense =
        interceptingPlayer.team === ballContactObj.player.team
          ? "Illegally touched by defense"
          : "Blocked by offense";
      return this.handleUnsuccessfulInterception(touchedByOffenseOrDefense);
    }

    // Ok now we know the contacts are from the intercepting player, lets check for the kick time
    const firstTouchTime = this.getState("interceptFirstTouchTime");
    if (!firstTouchTime) throw Error("No first touch time");

    // Check if the int was kicked yet or not
    const intKicked = this.stateExists("interceptionAttemptKicked");

    // Int kicker touches ball after it was kicked, its no good
    if (intKicked) {
      return this.handleUnsuccessfulInterception(
        "Illegally touched by defense"
      );
    }

    const withinTime = GameReferee.checkIfInterceptionWithinTime(
      firstTouchTime,
      Room.game.getTime()
    );

    if (!withinTime) {
      return this.handleUnsuccessfulInterception("Drag on kick");
    }

    // He finally kicks it, meaning there is a legal int attempt
    if (ballContactObj.type === "kick")
      return this._handleInterceptionKick(ballContactObj);
  }

  protected _handleInterceptionKick(ballContactObj: BallContact) {
    this.setState("interceptionAttemptKicked");
    Room.game.swapOffenseAndUpdatePlayers();
    this.setBallCarrier(ballContactObj.player);
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
    this.setState("interceptFirstTouchTime", Room.game.getTime());

    if (ballContactObj.type === "kick")
      return this._handleInterceptionKick(ballContactObj);
  }

  protected _handleBallContactDefense(ballContactObj: BallContact) {
    // If the ball wasn't passed yet, ball must have been blitzed
    if (!this.getState("ballPassed")) return this.setState("ballBlitzed");

    const { mapSection } = this._getStatInfo(ballContactObj.playerPosition);

    Room.game.stats.updatePlayerStat(ballContactObj.player.id, {
      passDeflections: { [mapSection]: 1 },
    });

    Room.game.stats.updatePlayerStat(this._quarterback.id, {
      passAttempts: { [mapSection]: 1 },
    });

    Chat.send("Deflection!");
    this.setState("ballDeflected");

    this._handleInterceptionAttempt(ballContactObj);
  }

  // This method needs to be made public since it can be called by our event observer
  handleUnsuccessfulInterception(badIntReason: BadIntReasons) {
    Chat.send(`Interception unsuccessful: ${badIntReason}`);
    // This means we swapped offense, so reswap again
    if (this.stateExists("interceptionAttemptKicked")) {
      Room.game.swapOffenseAndUpdatePlayers();
    }

    return this.endPlay({});
  }

  protected _handleSuccessfulInterception() {
    Chat.send("Successful Int!");

    const interceptingPlayer = this.getState("interceptingPlayer")!;

    Room.game.stats.updatePlayerStat(interceptingPlayer.id, {
      interceptionsReceived: 1,
    });

    Room.game.stats.updatePlayerStat(this._quarterback.id, {
      interceptionsThrown: 1,
    });

    this.setState("interceptionRuling");
    this.setState("ballIntercepted");

    const endPosition = this.getState("interceptionPlayerEndPosition");

    if (!endPosition) return;

    Chat.send("we have a tackle position");

    return this.endPlay({ endPosition, resetDown: true });
  }

  protected _handleInterceptionBallCarrierOutOfBounds(
    ballCarrierPosition: Position
  ) {
    // This method only runs when we dont have an end position yet

    // If the ruling on the int is good
    // And there isnt a saved position yet for this play
    // Then its a regular ballcarrier out of bounds
    if (this.getState("interceptionRuling")) {
      const { endPosition, endYard } =
        this._getPlayDataOffense(ballCarrierPosition);

      Chat.send(
        `${this._ballCarrier?.name} stepped out of bounds at the ${endYard}`
      );

      Chat.send("Stepped out of bounds during an int");
      return this.endPlay({
        endPosition: endPosition,
        resetDown: true,
      });
    }

    // Otherwise set that as the saved position, and now we dont run this method anymore
    this.setState("interceptionPlayerEndPosition", ballCarrierPosition);
  }

  protected _handleTackle(playerContact: PlayerContact) {
    const { endPosition, netYards, endYard } = this._getPlayDataOffense(
      playerContact.ballCarrierPosition
    );

    Chat.send(
      `${playerContact.player} tackled the ball carrier at the ${endYard}`
    );

    Room.game.stats.updatePlayerStat(playerContact.player.id, {
      tackles: 1,
    });

    // CHECK FOR SACK OKAY!

    const isSack = GameReferee.checkIfSack(
      playerContact.ballCarrierPosition,
      Room.game.down.getLOS().x,
      Room.game.offenseTeamId
    );

    // No sacks on interceptions
    if (isSack && this.stateExists("ballIntercepted") === false) {
      Chat.send("SACK!");

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
        endPosition,
        netYards,
        resetDown: true,
      });
    }

    this.endPlay({
      endPosition,
      netYards,
    });
  }

  protected _handleInterceptionTackle(playerContactObj: PlayerContact) {
    // If there was a ruling on if the int was good or not and it was successful, handle the tackle
    if (this.getState("interceptionRuling"))
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
  private _handleTwoPointTouchdown() {
    Room.game.addScore(Room.game.offenseTeamId, 7);
    Ball.score(Room.game.defenseTeamId);
  }

  /**
   * Handles regular touchdown
   */
  private _handleRegularTouchdown(endPosition: Position) {
    const { netYards } = this._getPlayDataOffense(endPosition);
    Chat.send("TOUCHDOWN");
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

    this._setLivePlay(false);

    Room.game.addScore(Room.game.offenseTeamId, 7);
    Ball.score(Room.game.defenseTeamId);
    // Can set the state "canTwoPoint" probs here
  }

  /**
   * Handles an auto touchdown after three redzone penalties
   */
  _handleAutoTouchdown() {}

  handleTouchdown(position: Position) {
    // First we need to get the type of touchdown, then handle
    if (this.stateExistsUnsafe("twoPointAttempt"))
      return this._handleTwoPointTouchdown();
    return this._handleRegularTouchdown(position);
    // const { name, team } = this.getBallCarrier();
    // if (this.getState("twoPoint") === false) {
    //   Chat.send("yup");
    //   down.setState("canTwoPoint");
    // }
    // // Get what kind of touchdown for stats
    // const endzone = getOpposingTeamEndzone(team);
    // const { netYards } = this.getPlayData({ x: endzone }, team);
    // sendPlayMessage({
    //   type: PLAY_TYPES.TOUCHDOWN,
    //   playerName: name,
    //   netYards: netYards,
    // });
    // game.setLivePlay(false);
    // return this.getState("twoPoint")
    //   ? this.scorePlay(2, game.getOffenseTeam())
    //   : this.scorePlay(7, game.getOffenseTeam());
  }

  // onKickDrag(dragAmount) {
  //   handlePenalty({
  //     type: PENALTY_TYPES.SNAP_DRAG,
  //     playerName: this._quarterback.name,
  //   });
  // }

  // handleIllegalCrossOffense() {
  //   handlePenalty({
  //     type: PENALTY_TYPES.ILLEGAL_LOS_CROSS,
  //     playerName: this._quarterback.name,
  //   });
  // }

  // #handleIllegalTouch(playerName) {
  //   handlePenalty({ type: PENALTY_TYPES.ILLEGAL_PASS, playerName: playerName });
  // }

  // handleAutoTouchdown() {
  //   // After three redzone penalties

  //   Chat.send(`AUTO TOUCHDOWN!`);

  //   this.scorePlay(7, game.getOffenseTeam());
  // }
}
