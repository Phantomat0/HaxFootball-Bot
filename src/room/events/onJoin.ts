import client from "..";
import HBClient, { FullPlayerObject } from "../HBClient";
import { SHOW_DEBUG_CHAT } from "../roomConfig";
import Room from "../roomStructures/Room";
import Greeter from "../roomStructures/Greeter";

const alreadyHasAuthOrConnInRoom = (
  auth: FullPlayerObject["auth"],
  conn: FullPlayerObject["conn"]
) => {
  if (Room.players.findOne({ auth: auth })) return true;
  if (Room.players.findOne({ ip: conn })) return true;
  return false;
};

const onJoin: HBClient["onPlayerJoin"] = (player) => {
  if (
    alreadyHasAuthOrConnInRoom(player.auth, player.conn) &&
    SHOW_DEBUG_CHAT === false
  )
    return client.kickPlayer(player.id, "Conn already exists in room", false);

  // Give the first player admin
  if (Room.players.find().length === 0) client.setPlayerAdmin(player.id, true);

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
