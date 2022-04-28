import onChat from "./events/onChat";
import onGameTick from "./events/onGameTick";
import onJoin from "./events/onJoin";
import HBClient from "./HBClient";
import roomConfig from "./roomConfig";
import Room from "./roomStructures/Room";
import HFL_MAP from "./utils/map";

//@ts-ignore
const client: HBClient = HBInit(roomConfig);

export default client;

Room.initClient(client);

client.setCustomStadium(HFL_MAP);

client.onPlayerJoin = (player) => {
  client.setPlayerAdmin(player.id, true);
};

client.onPlayerBallKick = (player) => {
  console.log("Kick", player);
  // console.log(Room.lmao);
};

client.onPlayerJoin = onJoin;

client.onGameTick = onGameTick;

client.onPlayerChat = onChat;
