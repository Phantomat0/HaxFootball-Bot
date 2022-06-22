import Player from "../../classes/Player";
import { FullPlayerObject } from "../../HBClient";
import Collection from "../../utils/Collection";

type IMute = Pick<FullPlayerObject, "name" | "auth" | "id">;

export default class MuteManager {
  readonly mutedCollection: Collection<FullPlayerObject["auth"], IMute> =
    new Collection();

  addMute(playerBeingMuted: Player) {
    const mutedInfo = {
      name: playerBeingMuted.name,
      auth: playerBeingMuted.auth,
      id: playerBeingMuted.id,
    };

    this.mutedCollection.set(playerBeingMuted.auth, mutedInfo);
  }

  removeMute(auth: FullPlayerObject["auth"]) {
    this.mutedCollection.delete(auth);
  }
}
