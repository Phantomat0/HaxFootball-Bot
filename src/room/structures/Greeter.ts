import { FullPlayerObject } from "../HBClient";
import Chat from "../roomStructures/Chat";
import COLORS from "../utils/colors";

export default class Greeter {
  static greetPlayer(player: FullPlayerObject) {
    Chat.send(`!rules for rules, !stats for stats`, {
      id: player.id,
      color: COLORS.LightBlue,
    });
    Chat.send(
      `Whats new: Auto punt on 4th and long | MVP after every match | Better blocking during runs`,
      {
        id: player.id,
        color: COLORS.LightGreen,
      }
    );
  }
}
