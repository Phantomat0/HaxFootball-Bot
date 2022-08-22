import Chat from "./Chat";
import { randFromArrayWeighted } from "../utils/utils";

interface Announcement {
  text: string;
  weight: number;
}

const ANNOUNCEMENTS: Announcement[] = [
  {
    text: `!stats or !stats partialplayername to view your stats or that of another player`,
    weight: 0.3,
  },
  {
    text: `Join our Discord discord.gg/VdrD2p7`,
    weight: 0.3,
  },
];

export default class Marquee {
  static run() {
    const TWO_MINUTES_IN_MS = 140000;
    setInterval(async () => {
      const announcementObj = randFromArrayWeighted(ANNOUNCEMENTS);

      const announcementText = announcementObj.text;
      Chat.send(announcementText, { sound: 0 });
    }, TWO_MINUTES_IN_MS);
  }
}
