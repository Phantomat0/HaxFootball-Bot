import HBClient from "../HBClient";
import Room from "../roomStructures/Room";

const onPlayerTeamChange: HBClient["onPlayerTeamChange"] = (player) => {
  if (!Room.isBotOn || !Room.game) return;
  Room.game.updateStaticPlayers();
  const recordId = Room.game.players.handlePlayerTeamChange(
    player,
    Room.game.getTimeRounded()
  );
  Room.game.checkIfTightEndSwitchedTeamsOrLeft(player.id);
  if (player.team === 1 || player.team === 2) {
    if (!Room.game.stats) return;
    Room.game.stats.maybeCreateStatProfile(recordId);
    Room.game.down.maybeMovePlayerBehindLosOnField(player);
  }
};

export default onPlayerTeamChange;
