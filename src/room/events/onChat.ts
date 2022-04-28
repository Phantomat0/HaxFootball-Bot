import { PlayerObject } from "../HBClient";
import Snap from "../plays/snap";
import Room from "../roomStructures/Room";

export default function onChat(player: PlayerObject, message: string) {
  if (message === "hike") {
    console.log("SET PLAY YEP");
    return Room.setPlay(new Snap(player));
  }
  if (message === "lmao") {
    console.log(Room);
  }
}
