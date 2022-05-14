import Room from "../..";
import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { PlayableTeamId, PlayerObject, Position } from "../../HBClient";
import Chat from "../../roomStructures/Chat";
import Ball from "../../structures/Ball";
import GameReferee from "../../structures/GameReferee";
import MapReferee from "../../structures/MapReferee";
import { MapSectionName } from "../../utils/MapSectionFinder";
import BasePlay from "../BasePlay";
import { BadIntReasons } from "../Snap";

export interface SnapStore {
  ballSnapped: true;
  ballPassed: true;
  ballCaught: true;
  catchPosition: Position;
  ballDeflected: true;
  ballRan: true;
  ballBlitzed: true;
  lineBlitzed: true;
  interceptionAttempt: true;
  interceptionAttemptKicked: true;
  interceptingPlayer: PlayerObject;
  ballIntercepted: true;
  interceptFirstTouchTime: number;
  interceptionRuling: boolean;
  interceptionPlayerEndPosition: Position;
  interceptionTackler: PlayerObject;
}

export default abstract class SnapEvents extends BasePlay<SnapStore> {
  abstract getQuarterback(): any;
  protected abstract _handleCatch(ballContactObj: BallContact): any;
  protected abstract _handleRun(playerContactObj: PlayerContact): any;
  protected abstract _handleIllegalTouch(ballContactObj: BallContact): any;
  protected abstract _handleBallContactQuarterback(
    ballContactObj: BallContact
  ): any;
  protected abstract _handleBallContactOffense(
    ballContactObj: BallContact
  ): any;
  protected abstract _handleBallContactDefense(
    ballContactObj: BallContact
  ): any;
  protected abstract _handleSuccessfulInterception(): any;
  protected abstract _handleInterceptionTackle(
    playerContactObj: PlayerContact
  ): any;
  protected abstract _handleTackle(playerContactObj: PlayerContact): any;
  protected abstract _handleBallContactDuringInterception(
    ballContactObj: BallContact
  ): any;
  protected abstract _handleInterceptionBallCarrierOutOfBounds(
    ballCarrierPosition: Position
  ): any;

  abstract handleUnsuccessfulInterception(message: BadIntReasons): any;
  protected abstract _getStatInfo(endPosition: Position): {
    quarterback: PlayerObject;
    mapSection: MapSectionName;
  };

  validateBeforePlayBegins(): {
    valid: boolean;
    message?: string;
    sendToPlayer?: boolean;
  } {
    Room.game.updateStaticPlayers();
    console.log(Room.game.players.getDefense());
    console.log(Room.game.players.getOffense());
    // Check if they can even run the command
    return {
      valid: true,
    };

    // Check for penalties
  }

  run() {
    Room.game.updateStaticPlayers();
    this._setLivePlay(true);
    Ball.release();
    this.setState("ballSnapped");
  }

  handleBallOutOfBounds(ballPosition: Position) {
    // Check if this was a result of an int attempt
    if (this.stateExists("interceptionAttempt")) {
      const isSuccessfulInt =
        GameReferee.checkIfInterceptionSuccessful(ballPosition);

      if (isSuccessfulInt) return this._handleSuccessfulInterception();

      return this.handleUnsuccessfulInterception("Ball out of bounds");
    }

    const { mapSection } = this._getStatInfo(ballPosition);

    Room.game.stats.updatePlayerStat(this.getQuarterback().id, {
      passAttempts: {
        [mapSection]: 1,
      },
    });

    Chat.send(`Ball went out of bounds!`);
    return this.endPlay({});
  }
  handleBallCarrierOutOfBounds(ballCarrierPosition: Position) {
    if (this.stateExists("interceptionAttempt"))
      return this._handleInterceptionBallCarrierOutOfBounds(
        ballCarrierPosition
      );
    const isSafety = GameReferee.checkIfSafetyPlayer(
      ballCarrierPosition,
      Room.game.offenseTeamId
    );

    if (isSafety) return super.handleSafety();

    const { endPosition, netYards, endYard } =
      this._getPlayDataOffense(ballCarrierPosition);

    Chat.send(
      `${this.getBallCarrier().name} went out of bounds at the ${endYard}`
    );

    // If the QB went out of bounds, or ball was ran add rushing stats
    if (
      this.getQuarterback().id === this._ballCarrier?.id ||
      this.stateExists("ballRan")
    ) {
      Room.game.stats.updatePlayerStat(this._ballCarrier?.id!, {
        rushingAttempts: 1,
        rushingYards: netYards,
      });
    } else {
      const catchPosition = this.getState("catchPosition");

      const { mapSection } = this._getStatInfo(catchPosition);

      Room.game.stats.updatePlayerStat(this._ballCarrier?.id!, {
        receptions: { [mapSection]: 1 },
        receivingYards: { [mapSection]: netYards },
      });

      Room.game.stats.updatePlayerStat(this.getQuarterback().id, {
        passYards: { [mapSection]: netYards },
      });
    }

    this.endPlay({ endPosition, netYards });
  }

  handleBallCarrierContactOffense(playerContact: PlayerContact) {
    const { player, playerPosition, ballCarrierPosition } = playerContact;
    // Verify that its a legal run

    // fumbleCheck(playerSpeed, ballCarrierSpeed)

    // Chat.send(`X: ${playerSpeed.x.toFixed(3)} Y: ${playerSpeed.y.toFixed(3)} || X: ${ballCarrierSpeed.x.toFixed(3)} Y: ${ballCarrierSpeed.y.toFixed(3)}`)
    // Chat.send(`TOTAL: ${(Math.abs(playerSpeed.x) + Math.abs(playerSpeed.y) + Math.abs(ballCarrierSpeed.x) + Math.abs(ballCarrierSpeed.y)).toFixed(3)}`)

    const isBehindQuarterBack = MapReferee.checkIfBehind(
      playerPosition.x,
      ballCarrierPosition.x,
      player.team as PlayableTeamId
    );

    // If its a legal run, handle it, otherwise its a penalty
    if (isBehindQuarterBack) return this._handleRun(playerContact);

    Chat.send("Illegal Run");

    this.endPlay({});

    // handlePenalty({
    //   type: PENALTY_TYPES.ILLEGAL_RUN,
    //   playerName: player.name,
    // });

    // Might need to adjust the player's position here, but for now, nahhh lmao
  }

  handleBallCarrierContactDefense(playerContact: PlayerContact) {
    if (this.getState("interceptingPlayer"))
      return this._handleInterceptionTackle(playerContact);

    this._handleTackle(playerContact);
  }

  /**
   * Determines whether the ball contact was offense or defense and handles
   */
  handleBallContact(ballContactObj: BallContact) {
    // Normally if any of these states were true, our eventlistener wouldnt run
    // but handleBallContact can also be run from our onPlayerBallKick
    if (
      this.stateExists("ballCaught") ||
      this.stateExists("ballRan") ||
      this.stateExists("ballBlitzed")
    )
      return;

    // Handle any contact during an int seperately
    if (this.stateExists("interceptionAttempt"))
      return this._handleBallContactDuringInterception(ballContactObj);

    const {
      player: { team },
    } = ballContactObj;

    return team === Room.game.offenseTeamId
      ? this._handleBallContactOffense(ballContactObj)
      : this._handleBallContactDefense(ballContactObj);
  }
}
