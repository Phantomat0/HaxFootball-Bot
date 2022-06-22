import BallContact from "../classes/BallContact";
import HBClient from "../HBClient";
import Room from "../roomStructures/Room";

const onBallKick: HBClient["onPlayerBallKick"] = (player) => {
  if (!Room.isBotOn) return;
  if (!Room?.game?.play?.isLivePlay) return;

  const { position } = player;
  const ballContact = new BallContact("kick", player, position);

  Room.game.play!.onBallContact(ballContact);
};

export default onBallKick;
