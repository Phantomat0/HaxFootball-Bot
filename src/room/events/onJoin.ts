import Room, { client } from "..";
import { FullPlayerObject } from "../HBClient";
import { SHOW_DEBUG_CHAT } from "../roomConfig";
import Chat from "../roomStructures/Chat";
import COLORS from "../utils/colors";

export default function onJoin(player: FullPlayerObject) {
  Room.players.createAndAdd(player);

  Chat.send(
    `Whats new: Passer Rating, QB can move ball anywhere behind LOS, defense can blitz 3 seconds after ball has been moved`,
    { id: player.id, color: COLORS.LightBlue }
  );

  if (!Room.isBotOn) return;

  if (SHOW_DEBUG_CHAT) {
    client.setPlayerAdmin(player.id, true);
    if (client.getPlayerList().length === 1) {
      client.startGame();
      client.setPlayerTeam(player.id, 1);
      client.setPlayerDiscProperties(player.id, { x: -150, y: 0 });
    } else {
      client.setPlayerTeam(player.id, 2);
      client.setPlayerDiscProperties(player.id, { x: 150, y: 0 });
    }
  }
}
