import onChat from "./events/onChat";
import HBClient from "./HBClient";
import roomConfig from "./roomConfig";
import Room from "./structures/Room";

//@ts-ignore
const room: HBClient = HBInit(roomConfig);

Room.initClient(room);

room.onPlayerJoin = (player) => {
  room.setPlayerAdmin(player.id, true);
};

room.onPlayerBallKick = (player) => {
  console.log("Kick", player);
  console.log(Room.lmao);
};

room.onPlayerChat = onChat;
