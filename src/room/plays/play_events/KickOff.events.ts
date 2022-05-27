import Room from "../..";
import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { PlayerObject, PlayerObjFlat, Position } from "../../HBClient";
import Chat from "../../roomStructures/Chat";
import Ball from "../../roomStructures/Ball";
import GameReferee from "../../structures/GameReferee";
import MapReferee from "../../structures/MapReferee";
import ICONS from "../../utils/Icons";
import BasePlay from "../BasePlay";

export interface KickOffStore {
  kickOff: true;
  kickOffCaught: true;
  catchPosition: true;
  kickOffKicked: true;
  KickOffKicker: PlayerObjFlat;
  safetyKickoff: true;
}

export default abstract class KickOffEvents extends BasePlay<KickOffStore> {
  protected abstract _checkIfOffenseOffsidesOnKick(): {
    isOffsides: boolean;
    offsidesPlayer: PlayerObject | null;
  };
  protected abstract _handleOffensePenalty(
    player: PlayerObjFlat,
    penaltyName: "offsidesOffense" | "drag" | "ballOutOfBounds"
  ): void;
  protected abstract _handleCatch(ballContactObj: BallContact): void;

  onBallCarrierContactDefense(playerContact: PlayerContact): void {
    const { endPosition, netYards, yardAndHalfStr } = this._getPlayDataOffense(
      playerContact.ballCarrierPosition
    );

    Chat.send(`${ICONS.HandFingersSpread} Tackle ${yardAndHalfStr}`);

    const { isSafety, isTouchback } =
      GameReferee.checkIfSafetyOrTouchbackPlayer(
        this._startingPosition,
        endPosition,
        Room.game.offenseTeamId
      );

    if (isSafety) return super.handleSafety();
    if (isTouchback) return super.handleTouchback();

    this.endPlay({
      newLosX: endPosition.x,
      netYards,
    });
  }

  onBallCarrierContactOffense(playerContact: PlayerContact): void {
    // Nothing interesting happens since we dont allow runs on kickoff
  }

  onBallCarrierOutOfBounds(ballCarrierPosition: Position): void {
    const { endPosition, yardAndHalfStr } =
      this._getPlayDataOffense(ballCarrierPosition);

    Chat.send(
      `${this.getBallCarrier().name} went out of bounds ${yardAndHalfStr}`
    );

    const { isSafety, isTouchback } =
      GameReferee.checkIfSafetyOrTouchbackPlayer(
        this._startingPosition,
        endPosition,
        Room.game.offenseTeamId
      );

    if (isSafety) return super.handleSafety();
    if (isTouchback) return super.handleTouchback();

    this.endPlay({ newLosX: endPosition.x });
  }

  onBallContact(ballContactObj: BallContact): void {
    if (this.stateExists("kickOffCaught")) return;
    super.onBallContact(ballContactObj);
  }

  onBallOutOfBounds(ballPosition: Position): void {
    const kicker = this.getState("KickOffKicker");

    this._handleOffensePenalty(kicker, "ballOutOfBounds");
  }

  onKickDrag(player: PlayerObjFlat | null): void {
    const fieldedPlayers = Room.game.players.getFielded();

    // We have to get the closest player to the ball to determine the kicker, since it could be anyone
    const playerClosestToBall = MapReferee.getClosestPlayerToBall(
      Ball.getPosition(),
      fieldedPlayers
    );

    // We swap offense since the swap happens on the kick, and we haven't kicked it yet
    if (this.stateExists("kickOffKicked") === false) {
      Room.game.swapOffenseAndUpdatePlayers();
    }

    this._handleOffensePenalty(playerClosestToBall!, "drag");
  }

  protected _onBallContactDefense(ballContactObj: BallContact): void {
    const { yardAndHalfStr, endPosition } = this._getPlayDataOffense(
      ballContactObj.playerPosition
    );

    // Ball downed by own team
    Chat.send(`${ICONS.Pushpin} Ball downed by defense ${yardAndHalfStr}`);

    // Check where the ball was downed at
    // The catch position is the same as the endzone position
    // Adjust it for defense, since they are the ones making contact
    const { isTouchback } = GameReferee.checkIfSafetyOrTouchbackPlayer(
      this._startingPosition,
      endPosition,
      Room.game.offenseTeamId
    );

    if (isTouchback) return this.handleTouchback();

    this.endPlay({ newLosX: endPosition.x });
  }

  protected _onBallContactOffense(ballContactObj: BallContact): void {
    // We have to know if it was kicked off first
    // Kicking team starts off as offense, switched to defense moment the ball is kicked

    // Kicking team touches
    if (this.stateExists("kickOffKicked") === false) {
      if (ballContactObj.type === "kick") {
        this.setState("kickOffKicked");
        this.setState("KickOffKicker", ballContactObj.player);

        // Before we swap, check for the penalty
        const { isOffsides, offsidesPlayer } =
          this._checkIfOffenseOffsidesOnKick();

        Room.game.swapOffenseAndUpdatePlayers();

        if (isOffsides)
          return this._handleOffensePenalty(offsidesPlayer!, "offsidesOffense");
      }

      return;
    }

    // Receiving team touches
    this._handleCatch(ballContactObj);
  }
}
