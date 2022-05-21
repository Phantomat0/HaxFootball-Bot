import Room from "../..";
import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { PlayerObject, PlayerObjFlat, Position } from "../../HBClient";
import Chat from "../../roomStructures/Chat";
import Ball from "../../structures/Ball";
import DistanceCalculator from "../../structures/DistanceCalculator";
import GameReferee from "../../structures/GameReferee";
import BasePlay from "../BasePlay";

export interface KickOffStore {
  kickOff: true;
  kickOffCaught: true;
  kickOffKicked: true;
}

export default abstract class KickOffEvents extends BasePlay<KickOffStore> {
  validateBeforePlayBegins(player: PlayerObject | null): void {
    // No validations, since this is run by the bot never the player :)
  }

  /**
   * The kickoff position is either at the 50, or at the defenive team's 20 in the case of a safety
   */
  private _determineKickOffPosition(): Position {
    const isKickOffAfterSafety = false;

    if (isKickOffAfterSafety) return { x: -155, y: 0 };

    return { x: 0, y: 0 };
  }

  prepare() {
    const kickOffPosition = this._determineKickOffPosition();

    Ball.setPosition(kickOffPosition);
    this.setBallPositionOnSet(kickOffPosition);
    Room.game.down.setLOS(kickOffPosition.x);
  }

  run(): void {
    this._setLivePlay(true);
    Ball.release();
    this.setState("kickOff");
  }

  handleBallCarrierContactDefense(playerContact: PlayerContact): void {
    // Tackle

    const { endPosition, netYards, endYard } = this._getPlayDataOffense(
      playerContact.ballCarrierPosition
    );

    Chat.send(
      `${playerContact.player.name} tackled the ball carrier at the ${endYard}`
    );

    this.endPlay({
      newLosX: endPosition.x,
      netYards,
      resetDown: true,
    });
  }

  handleBallCarrierContactOffense(playerContact: PlayerContact): void {
    // Nothing interesting happens since we dont allow runs on kickoff
  }

  handleBallCarrierOutOfBounds(ballCarrierPosition: Position): void {
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

    console.log(this._startingPosition, endPosition, netYards);

    this.endPlay({ newLosX: endPosition.x, resetDown: true });
  }

  handleBallContact(ballContactObj: BallContact): void {
    if (this.stateExists("kickOffCaught")) return;
    super.handleBallContact(ballContactObj);
  }

  handleBallOutOfBounds(ballPosition: Position): void {
    const { yardLine, distance } = new DistanceCalculator(ballPosition.x)
      .roundToYardByTeam(Room.game.offenseTeamId)
      .calculateAndConvert();

    Chat.send(`Ball went out of bounds at the ${yardLine}`);

    this.endPlay({ newLosX: distance, resetDown: true });
  }

  onKickDrag(player: PlayerObjFlat): void {}
}
