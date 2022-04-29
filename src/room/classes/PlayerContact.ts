import { PlayerObject, Position, Speed } from "../HBClient";
import { flattenPlayer } from "../utils/haxUtils";

export default class PlayerContact {
  player: ReturnType<typeof flattenPlayer>;
  playerPosition: Position;
  playerSpeed: Speed;
  ballCarrierPosition: Position;
  ballCarrierSpeed: Speed;
  constructor(
    player: PlayerObject,
    playerPosition: Position,
    playerSpeed: Speed,
    ballCarrierPosition: Position,
    ballCarrierSpeed: Speed
  ) {
    this.player = flattenPlayer(player);
    this.playerPosition = playerPosition;
    this.playerSpeed = playerSpeed;
    this.ballCarrierPosition = ballCarrierPosition;
    this.ballCarrierSpeed = ballCarrierSpeed;
  }
}
