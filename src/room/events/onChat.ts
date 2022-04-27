import { PlayerObject } from "../HBClient";
import Room from "../structures/Room";

export default function onChat(player: PlayerObject, message: string) {
  if (message === "r") {
    Room.getPlayers();
    Room.lmao = 5;
  }
}
