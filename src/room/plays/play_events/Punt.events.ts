import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { Position } from "../../HBClient";
import BasePlay from "../BasePlay";

export interface PuntStore {
  punt: true;
  puntCaught: true;
  puntKicked: true;
  catchPosition: Position;
}

export default abstract class PuntEvents extends BasePlay<PuntStore> {
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
