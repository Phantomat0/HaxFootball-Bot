import client from "..";
import HBClient from "../HBClient";
import Room from "../roomStructures/Room";

const onAdminChange: HBClient["onPlayerAdminChange"] = (
  changedPlayer,
  byPlayer
) => {
  if (byPlayer === null) return;
  const changedPlayerProf = Room.players.playerCollection.get(
    changedPlayer.id
  )!;
  const byPlayerProf = Room.players.playerCollection.get(byPlayer.id)!;

  const canChangeAdmin = byPlayerProf.canModerate(changedPlayerProf);

  if (!canChangeAdmin) {
    client.kickPlayer(byPlayer.id, "Nice try", false);
    changedPlayerProf.setAdmin(true);
  }
};

export default onAdminChange;
