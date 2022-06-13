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
    const { endPosition, netYards, yardAndHalfStr, netYardsStr } =
      this._getPlayDataOffense(playerContact.ballCarrierPosition);

    const isFumble = this._checkForFumble(playerContact);

    if (isFumble) this._handleFumble(playerContact, this._ballCarrier!);

    Chat.send(
      `${ICONS.HandFingersSpread} Tackle ${yardAndHalfStr} | ${netYardsStr}`
    );

    Room.game.stats.updatePlayerStat(this._ballCarrier!.id, {
      specReceptions: 1,
      specReceivingYards: netYards,
    });

    Room.game.stats.updatePlayerStat(playerContact.player.id, {
      specTackles: 1,
    });

    const { isSafety, isTouchback } =
      GameReferee.checkIfSafetyOrTouchbackPlayer(
        this._startingPosition,
        endPosition,
        Room.game.offenseTeamId
      );

    if (isSafety) return super._handleSafety();
    if (isTouchback) return super._handleTouchback();

    this.endPlay({
      newLosX: endPosition.x,
      netYards,
    });
  }

  onBallCarrierContactOffense(playerContact: PlayerContact): void {
    // Nothing interesting happens since we dont allow runs on kickoff
  }

  onBallCarrierOutOfBounds(ballCarrierPosition: Position): void {
    const { endPosition, yardAndHalfStr, netYards, netYardsStr } =
      this._getPlayDataOffense(ballCarrierPosition);

    Chat.send(
      `${
        this.getBallCarrier().name
      } went out of bounds ${yardAndHalfStr} | ${netYardsStr}`
    );

    Room.game.stats.updatePlayerStat(this._ballCarrier!.id, {
      specReceptions: 1,
      specReceivingYards: netYards,
    });

    const { isSafety, isTouchback } =
      GameReferee.checkIfSafetyOrTouchbackPlayer(
        this._startingPosition,
        endPosition,
        Room.game.offenseTeamId
      );

    if (isSafety) return super._handleSafety();
    if (isTouchback) return super._handleTouchback();

    this.endPlay({ newLosX: endPosition.x });
  }

  onBallContact(ballContactObj: BallContact): void {
    if (this.stateExists("kickOffCaught")) return;
    super.onBallContact(ballContactObj);
  }

  onBallOutOfBounds(ballPosition: Position): void {
    const kicker = this.getState("KickOffKicker");

    const isTouchback = GameReferee.checkIfTouchbackBall(
      ballPosition,
      Room.game.offenseTeamId
    );

    if (isTouchback) return this._handleTouchback();

    this._handleOffensePenalty(kicker, "ballOutOfBounds");
  }

  onKickDrag(player: PlayerObjFlat | null): void {
    const fieldedPlayers = Room.game.players.getFielded();

    // We have to get the closest player to the ball to determine the kicker, since it could be anyone
    const playerClosestToBall = MapReferee.getNearestPlayerToPosition(
      fieldedPlayers,
      Ball.getPosition()
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

    if (isTouchback) return this._handleTouchback();

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
