import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { Position } from "../../HBClient";
import BasePlay from "../BasePlay";

export interface FieldGoalStore {
  fieldGoal: true;
  fieldGoalKicked: true;
  fieldGoalBlitzed: true;
}

export default abstract class FieldGoalEvents extends BasePlay<FieldGoalStore> {
  validateBeforePlayBegins() {
    return {
      valid: true,
      message: "",
      sendToPlayer: true,
    };
  }
  prepare() {
    // Room.game.updateStaticPlayers();
    // this.setBallPositionOnSet(Ball.getPosition());
    // this._startBlitzClock();
  }

  run() {}
  handleBallOutOfBounds(ballPosition: Position) {}
  handleBallCarrierOutOfBounds(ballCarrierPosition: Position) {}
  handleBallCarrierContactOffense(playerContact: PlayerContact) {}
  handleBallCarrierContactDefense(playerContact: PlayerContact) {}
  handleBallContact(ballContactObj: BallContact) {}
}
