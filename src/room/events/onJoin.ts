import client from "..";
import HBClient, { FullPlayerObject } from "../HBClient";
import { SHOW_DEBUG_CHAT } from "../roomConfig";
import Room from "../roomStructures/Room";
import Greeter from "../roomStructures/Greeter";

const alreadyHasAuthInRoom = (auth: FullPlayerObject["auth"]) => {
  if (Room.players.findOne({ auth: auth })) return true;
  return false;
};

const onJoin: HBClient["onPlayerJoin"] = (player) => {
  if (alreadyHasAuthInRoom(player.auth))
    return client.kickPlayer(player.id, "Conn already exists in room", false);
  Room.players.createAndAdd(player);

  Greeter.greetPlayer(player);
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
};

export default onJoin;
