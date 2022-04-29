import Room from "..";
import { PlayerObject } from "../HBClient";

export default function onLeave(player: PlayerObject) {
  if (!Room.isBotOn) return;
}
