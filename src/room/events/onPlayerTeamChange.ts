import Room from "..";
import { PlayerObject } from "../HBClient";

export default function onPlayerTeamChange(player: PlayerObject) {
  if (!Room.isBotOn) return;
  Room.game.updateStaticPlayers();
}
