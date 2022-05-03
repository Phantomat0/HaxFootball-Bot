import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { Position } from "../../HBClient";
import BasePlay from "../BasePlay";

export type FG_PLAY_STATES =
  | "fieldGoal"
  | "fieldGoalKicked"
  | "fieldGoalBlitzed";

export default abstract class FieldGoalEvents extends BasePlay<FG_PLAY_STATES> {
  validateBeforePlayBegins() {
    return {
      valid: true,
      message: "",
      sendToPlayer: true,
    };
  }
  run() {}
  handleBallOutOfBounds(ballPosition: Position) {}
  handleBallCarrierOutOfBounds(ballCarrierPosition: Position) {}
  handleBallCarrierContactOffense(playerContact: PlayerContact) {}
  handleBallCarrierContactDefense(playerContact: PlayerContact) {}
  handleBallContact(ballContactObj: BallContact) {}
}
