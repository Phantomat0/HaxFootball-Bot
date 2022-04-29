import Room from "..";
import BallContact from "../classes/BallContact";
import { PlayableTeamId, PlayerObject, Position } from "../HBClient";
import Chat from "../roomStructures/Chat";
import DistanceCalculator from "../structures/DistanceCalculator";
import MapReferee from "../structures/MapReferee";
import { MAP_POINTS } from "../utils/map";
import BasePlay from "./BasePlay";

export default class Snap extends BasePlay<SNAP_PLAY_STATES> {
  private _quarterback: PlayerObject;
  constructor(time: number, quarterback: PlayerObject) {
    super(time);
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
    Room.game.updateStaticPlayers();
    this._setLivePlay(true);
    this.setState("ballSnapped");
  }

  getQuarterback() {
    return this._quarterback;
  }

  private _handleCatch(ballContactObj: BallContact) {
    const { player, playerPosition } = ballContactObj;
    const { name } = player;

    const isOutOfBounds = MapReferee.checkIfOutOfBounds(
      playerPosition,
      MAP_POINTS.PLAYER_RADIUS
    );
    if (isOutOfBounds) {
      Chat.send(`Pass Incomplete, caught out of bounds by ${name}`);
      // return resetBall();
      return;
    }

    this.setState("ballCaught");

    Chat.send(`Pass caught by ${name}`);

    this.setBallCarrier(player);
  }

  private _handleIllegalTouch(ballContactObj: BallContact) {
    Chat.send("ILLEGAL TOUCH");
  }

  _handleBallContactQuarterback(ballContactObj: BallContact) {
    const { type } = ballContactObj;

    // QB tries to catch their own pass
    const qbContactAfterPass = this.readState("ballPassed");
    if (qbContactAfterPass) return;

    // QB touched the ball before the pass
    const qbTouchedBall = type === "touch";
    if (qbTouchedBall) return;

    // QB kicks the ball, aka passes
    const qbKicksBall = type === "kick";
    if (qbKicksBall) {
      this.setState("ballPassed");
      return Chat.send("Ball Passed!");
    }
  }

  _handleBallContactOffense(ballContactObj: BallContact) {
    const { player } = ballContactObj;
    const { id } = player;

    const isQBContact = id === this.getQuarterback().id;

    if (isQBContact) return this._handleBallContactQuarterback(ballContactObj);

    // Receiver touched but there wasnt a pass yet
    const touchButNoQbPass = this.readState("ballPassed") === null;
    if (touchButNoQbPass) return this._handleIllegalTouch(ballContactObj);

    this._handleCatch(ballContactObj);
  }
  _handleBallContactDefense(ballContactObj: BallContact) {
    if (this.readState("ballPassed") === null)
      return this.setState("ballBlitzed");

    this.setState("ballDeflected");
    Chat.send("Deflection!");
    this._setLivePlay(false);
  }

  handleBallOutOfBounds(ballPosition: Position) {
    const { x: ballPositionX } = ballPosition;
    const { team } = this.getBallCarrier()!;

    const { yardLine: yardLineAtOutOfBounds } = new DistanceCalculator(x)
      .roundToYardByTeam(team as PlayableTeamId)
      .calculate();

    Chat.send(`Ball went out of bounds!`);

    const isSafety = MapReferee.checkIfSafetyBall(
      ballPositionX,
      Room.game.offenseTeamId as PlayableTeamId
    );
    if (isSafety) return super.handleSafety();

    // resetBall();
  }
  handleBallCarrierOutOfBounds(ballCarrierPosition: Position) {}
  handleTouchdown() {}
}

export type SNAP_PLAY_STATES =
  | "ballSnapped"
  | "ballPassed"
  | "ballCaught"
  | "ballDeflected"
  | "ballRan"
  | "ballBlitzed"
  | "ballIntercepted";
