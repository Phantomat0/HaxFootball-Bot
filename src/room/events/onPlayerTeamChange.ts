import Room from "..";
import { PlayerObject } from "../HBClient";

export default function onPlayerTeamChange(player: PlayerObject) {
  if (!Room.isBotOn || !Room.game) return;
  Room.game.updateStaticPlayers();

  if (player.team === 1 || player.team === 2) {
    if (!Room.game.stats) return;
    Room.game.stats.maybeCreateStatProfile(player);
    Room.game.down.maybeMovePlayerBehindLosOnField(player);
  }
}
