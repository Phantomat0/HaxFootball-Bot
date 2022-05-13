import onBallKick from "./events/onBallKick";
import onChat from "./events/onChat";
import onGameTick from "./events/onGameTick";
import onJoin from "./events/onJoin";
import onLeave from "./events/onLeave";
import onPlayerTeamChange from "./events/onPlayerTeamChange";
import HBClient, { TeamId } from "./HBClient";
import roomConfig from "./roomConfig";
import RoomClient from "./roomStructures/Room";
import HFL_MAP from "./utils/map";

//@ts-ignore
export const client: HBClient = HBInit(roomConfig);

const Room = new RoomClient(client);

export default Room;

interface TeamIdEnum {
  SPECTATORS: TeamId;
  RED: TeamId;
  BLUE: TeamId;
}

export const TEAMS: TeamIdEnum = {
  SPECTATORS: 0,
  RED: 1,
  BLUE: 2,
};

client.setCustomStadium(HFL_MAP);

// client.onGameStart = () => {
//   if (!Room.isBotOn) return;
//   game = new Game();
//   down = new Down();
//   kickOffInit();
// };

// client.onGameStop = () => {
//   if (!Room.isBotOn) return;
//   game = null;
//   down = null;
//   play = null;
// };

// client.onTeamGoal = () => {
//   if (!Room.isBotOn) return;
//   down.startNew();
// };

// client.onPositionsReset = () => {
//   if (!Room.isBotOn) return;
//   kickOffInit();
// };

client.onPlayerTeamChange = onPlayerTeamChange;

client.onPlayerBallKick = onBallKick;

client.onPlayerJoin = onJoin;

client.onPlayerLeave = onLeave;

client.onGameTick = onGameTick;

client.onPlayerChat = onChat;
