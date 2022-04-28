import BallContact from "../classes/BallContact";
import { PlayerObject } from "../HBClient";
import Chat from "../roomStructures/Chat";
import Room from "../roomStructures/Room";
import BasePlay from "./basePlay";

export default class Snap extends BasePlay<SNAP_PLAY_STATES> {
  private _quarterback: PlayerObject;
  private _ballCarrier: PlayerObject;

  constructor(quarterback: PlayerObject) {
    super();
    this._quarterback = quarterback;
    this._ballCarrier = quarterback;
  }

  validate(): { valid: boolean; message: string; sendToPlayer: boolean } {
    // Check if they can even run the command
    return {
      valid: true,
      message: "You are not on offense",
      sendToPlayer: true,
    };

    // Check for penalties
  }

  run() {
    console.log("RUN PLAY");
    this._setLivePlay(true);
    this.setState("ballSnapped");
  }

  getQuarterback() {
    return this._quarterback;
  }

  _handleBallContactOffense(ballContactObj: BallContact) {
    this.setState("ballCaught");
    Chat.send("CATCH!");
    this._setLivePlay(false);
  }
  _handleBallContactDefense(ballContactObj: BallContact) {
    this.setState("ballDeflected");
    Chat.send("Deflection!");
    this._setLivePlay(false);
  }
}

export type SNAP_PLAY_STATES =
  | "ballSnapped"
  | "ballCaught"
  | "ballDeflected"
  | "ballRan"
  | "ballBlitzed"
  | "ballIntercepted";
