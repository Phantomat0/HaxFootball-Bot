import HBClient from "../HBClient";
import Room from "../roomStructures/Room";
import { TEAMS } from "../utils/types";

const onLeave: HBClient["onPlayerLeave"] = (player) => {
  Room.players.delete(player);

  if (!Room.isBotOn || !Room.game) return;

  Room.game.players.updateStaticPlayerList(Room.game.offenseTeamId);

  const wasFielded = player.team === TEAMS.RED || player.team === TEAMS.BLUE;

  if (wasFielded) {
    Room.game.players.subOut(player, Room.game.getTimeRounded(), {
      wasLeave: true,
    });
    Room.game.checkIfTightEndSwitchedTeamsOrLeft(player.id);
  }
};

export default onLeave;
