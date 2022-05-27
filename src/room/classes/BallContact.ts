import { PlayerObject, PlayerObjFlat, Position } from "../HBClient";
import { flattenPlayer } from "../utils/haxUtils";

export type BallContactType = "kick" | "touch";

export default class BallContact {
  type: BallContactType;
  player: PlayerObjFlat;
  playerPosition: Position;
  constructor(
    contactType: BallContactType,
    player: PlayerObject,
    playerPosition: Position
  ) {
    this.type = contactType; // Either touch or kick
    this.player = flattenPlayer(player);
    this.playerPosition = playerPosition;
  }
}
