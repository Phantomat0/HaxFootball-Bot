import Room from "..";
import BallContact from "../classes/BallContact";
import { PlayerObject } from "../HBClient";

export default function onBallKick(player: PlayerObject) {
  if (!Room.isBotOn) return;
  if (!Room?.game?.play?.isLivePlay) return;

  const { position } = player;
  const ballContact = new BallContact("kick", player, position);

  Room.game.play!.handleBallContact(ballContact);
}
