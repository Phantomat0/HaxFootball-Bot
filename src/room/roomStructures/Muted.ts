import Player from "../classes/Player";
import { PlayerObject, FullPlayerObject } from "../HBClient";
import Collection from "../utils/Collection";

interface IMute {
  name: PlayerObject["name"];
  auth: FullPlayerObject["auth"];
}

export default class MuteManager {
  readonly mutedCollection: Collection<FullPlayerObject["auth"], IMute> =
    new Collection();

  addMute(playerBeingMuted: Player) {
    const mutedInfo = {
      name: playerBeingMuted.name,
      auth: playerBeingMuted.auth,
    };

    this.mutedCollection.set(playerBeingMuted.auth, mutedInfo);
  }

  removeMute(auth: FullPlayerObject["auth"]) {
    this.mutedCollection.delete(auth);
  }
}
