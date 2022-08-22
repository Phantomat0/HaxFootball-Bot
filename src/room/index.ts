import onAdminChange from "./events/onAdminChange";
import onBallKick from "./events/onBallKick";
import onChat from "./events/onChat";
import onGameTick from "./events/onGameTick";
import onJoin from "./events/onJoin";
import onLeave from "./events/onLeave";
import onPlayerTeamChange from "./events/onPlayerTeamChange";
import HBClient, { HBClientConfig } from "./HBClient";
import KickOff from "./plays/Kickoff";
import roomConfig from "./room.config";
import Room from "./roomStructures/Room";
import HFL_MAP from "./utils/map";

declare function HBInit(clientConfig: HBClientConfig): HBClient;

const client = HBInit(roomConfig);

export default client;

Room.onRoomLoad();

client.setCustomStadium(HFL_MAP);
client.setTimeLimit(9);
client.setScoreLimit(0);
client.setTeamsLock(true);

/* EVENTS */

client.onGameStart = () => {
  if (!Room.isBotOn) return;
  Room.startNewGame();
};

client.onGameStop = () => {
  if (!Room.isBotOn || !Room.game) return;
  Room.game.endGame();
};

client.onPositionsReset = () => {
  if (!Room.isBotOn || !Room.game) return;
  Room.game.down.startNew();
  Room.game.setState("canTwoPoint", false);
  Room.game.setState("twoPointAttempt", false);
  Room.game.setPlay(new KickOff(Room.game.getTimeRounded()), null);
};

client.onTeamGoal = () => {
  if (!Room.isBotOn || !Room.game) return;
  Room.game.deleteState("canTwoPoint");
};

client.onGamePause = () => {
  if (!Room.isBotOn || !Room.game) return;
  Room.game.setIsPaused(true);
};

client.onGameUnpause = () => {
  if (!Room.isBotOn || !Room.game) return;
  Room.game.setIsPaused(false);
};

client.onPlayerAdminChange = onAdminChange;

client.onPlayerTeamChange = onPlayerTeamChange;

client.onPlayerBallKick = onBallKick;

client.onPlayerJoin = onJoin;

client.onPlayerLeave = onLeave;

client.onGameTick = onGameTick;

client.onPlayerChat = onChat;
