import { FullPlayerObject, PlayerObject } from "../HBClient";
import Collection from "../utils/Collection";

export interface IBan {
  name: PlayerObject["name"];
  byBot: boolean;
  expirationDate: number | -1;
  reason: string | null;
  description?: string | null;

  // Can either be banned by IP or Auth
  auth?: FullPlayerObject["auth"][];
  ip?: string[];
  roomId?: PlayerObject["id"];
  byName?: string | null;
}

export default class BanManager {
  banCollection: Collection<FullPlayerObject["auth"], IBan> = new Collection();
}
