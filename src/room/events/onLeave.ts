import Room from "..";
import { PlayerObject } from "../HBClient";

export default function onLeave(player: PlayerObject) {
  Room.players.delete(player);

  if (!Room.isBotOn || !Room.game) return;

  Room.game.players.updateStaticPlayerList(Room.game.offenseTeamId);
}
