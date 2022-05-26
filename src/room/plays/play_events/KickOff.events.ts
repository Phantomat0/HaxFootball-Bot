import Room from "../..";
import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { PlayerObject, PlayerObjFlat, Position } from "../../HBClient";
import Chat from "../../roomStructures/Chat";
import Ball from "../../roomStructures/Ball";
import GameReferee from "../../structures/GameReferee";
import MapReferee from "../../structures/MapReferee";
import PreSetCalculators from "../../structures/PreSetCalculators";
import ICONS from "../../utils/Icons";
import BasePlay from "../BasePlay";

export interface KickOffStore {
  kickOff: true;
  kickOffCaught: true;
  kickOffKicked: true;
  KickOffKicker: PlayerObjFlat;
  catchPosition: Position;
  safetyKickoff: true;
}

export default abstract class KickOffEvents extends BasePlay<KickOffStore> {
  protected abstract _checkIfOffenseOffsidesOnKick(): {
    isOffsides: boolean;
    offsidesPlayer: PlayerObject | undefined;
  };

  protected abstract _handleCatch(ballContactObj: BallContact): void;

  onBallCarrierContactDefense(playerContact: PlayerContact): void {
    const { endPosition, netYards, yardAndHalfStr } = this._getPlayDataOffense(
      playerContact.ballCarrierPosition
    );

    Chat.send(`${ICONS.HandFingersSpread} Tackle ${yardAndHalfStr}`);

    const catchPosition = this.getState("catchPosition");

    const { isSafety, isTouchback } =
      GameReferee.checkIfSafetyOrTouchbackPlayer(
        catchPosition,
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
    const catchPosition = this.getState("catchPosition");

    const { isSafety, isTouchback } =
      GameReferee.checkIfSafetyOrTouchbackPlayer(
        catchPosition,
        ballCarrierPosition,
        Room.game.offenseTeamId
      );

    if (isSafety) return super.handleSafety();
    if (isTouchback) return super.handleTouchback();

    const { endPosition, netYards, yardAndHalfStr } =
      this._getPlayDataOffense(ballCarrierPosition);

    Chat.send(
      `${this.getBallCarrier().name} went out of bounds ${yardAndHalfStr}`
    );

    console.log(this._startingPosition, endPosition, netYards);

    this.endPlay({ newLosX: endPosition.x });
  }

  onBallContact(ballContactObj: BallContact): void {
    if (this.stateExists("kickOffCaught")) return;
    super.onBallContact(ballContactObj);
  }

  onBallOutOfBounds(ballPosition: Position): void {
    const kicker = this.getState("KickOffKicker");

    // Check if its a safety or not, if its a safety its defense 40 yard line
    const offenseFortyYardLine = PreSetCalculators.getPositionOfTeamYard(
      40,
      Room.game.offenseTeamId
    );

    const defenseFortyYardLine = PreSetCalculators.getPositionOfTeamYard(
      40,
      Room.game.defenseTeamId
    );

    const newLosX = this.stateExists("safetyKickoff")
      ? defenseFortyYardLine
      : offenseFortyYardLine;

    const penaltyType = this.stateExists("safetyKickoff")
      ? "kickOffOffsidesSafety"
      : "kickOffOutOfBounds";

    this._handlePenalty(penaltyType, kicker);

    this.endPlay({ newLosX: newLosX });
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

    const offenseFortyYardLine = PreSetCalculators.getPositionOfTeamYard(
      40,
      Room.game.offenseTeamId
    );

    const defenseFortyYardLine = PreSetCalculators.getPositionOfTeamYard(
      40,
      Room.game.defenseTeamId
    );

    // If its a safety, set it as the defense forty, otherwise its the offense forty
    const newLosX = this.stateExists("safetyKickoff")
      ? defenseFortyYardLine
      : offenseFortyYardLine;

    const penaltyType = this.stateExists("safetyKickoff")
      ? "kickOffDragSafety"
      : "kickOffDrag";

    this._handlePenalty(penaltyType, playerClosestToBall);

    this.endPlay({ newLosX: newLosX, resetDown: true });
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
      ballContactObj.playerPosition,
      ballContactObj.playerPosition,
      Room.game.offenseTeamId
    );

    if (isTouchback) return this.handleTouchback();

    this.endPlay({ newLosX: endPosition.x, resetDown: true });
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

        if (isOffsides) {
          // We have to check if its a safety or not

          const isSafetyKickoff = Room.game.stateExists("safetyKickoff");

          if (isSafetyKickoff)
            return this._handlePenalty(
              "kickOffOffsidesSafety",
              offsidesPlayer!
            );

          return this._handlePenalty("kickOffOffsides", offsidesPlayer!);
        }

        Room.game.swapOffenseAndUpdatePlayers();
      }

      return;
    }

    // Receiving team touches
    this._handleCatch(ballContactObj);
  }
}
