import Chat from "./Chat";
import { randFromArray } from "../utils/utils";

const ANNOUNCEMENTS: string[] = [
  "!stats or !stats partialplayername to view your stats or that of another player",
  "You can rush the field goal kicker before he kicks the fieldgoal",
  "Join our Discord discord.gg/VdrD2p7",
];

export default class Marquee {
  static run() {
    const TWO_MINUTES_IN_MS = 140000;
    setInterval(async () => {
      const announcement = randFromArray(ANNOUNCEMENTS);

      Chat.send(announcement, { sound: 0 });
    }, TWO_MINUTES_IN_MS);
  }
}
