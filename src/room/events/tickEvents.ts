import Room from "..";
import BallContact from "../classes/BallContact";
import PlayerContact from "../classes/PlayerContact";
import { PlayerObject } from "../HBClient";
import Ball from "../structures/Ball";
import DistanceCalculator from "../structures/DistanceCalculator";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import { MAP_POINTS } from "../utils/map";

const TOUCHING_DISTANCE = {
  PLAYER: MAP_POINTS.PLAYER_RADIUS * 2 + 1,
  BALL: MAP_POINTS.BALL_RADIUS + MAP_POINTS.PLAYER_RADIUS + 0.01,
};

export const checkBallContact = () => {
  const ballPosition = Ball.getPosition();
  const fielded = Room.game.players.getFielded();

  for (const player of fielded) {
    const { id } = player;
    const { position: playerPosition } = getPlayerDiscProperties(id);

    const distanceToBall = new DistanceCalculator()
      .calcDifference3D(playerPosition, ballPosition)
      .calculate();

    if (distanceToBall < TOUCHING_DISTANCE.BALL)
      return new BallContact("touch", player, playerPosition);
  }

  return null;
};

// This function takes an array of players as a parameter to allow for this function to be used for both runs and tackles
export const checkBallCarrierContact = (playerArray: PlayerObject[]) => {
  const ballCarrier = Room.getPlay().getBallCarrierSafe();

  // No ball carrier, i.e when the ball is passed but not caught
  if (playerArray.length === 0 || ballCarrier === null) return null;
  // Player array will never include the ballcarrier, we will filter him out
  const { position: ballCarrierPosition, speed: ballCarrierSpeed } =
    getPlayerDiscProperties(ballCarrier.id);

  for (const player of playerArray) {
    const { id } = player;
    if (id === ballCarrier.id) continue;
    const { position: playerPosition, speed: playerSpeed } =
      getPlayerDiscProperties(id);

    const distanceToBallCarrier = new DistanceCalculator()
      .calcDifference3D(playerPosition, ballCarrierPosition)
      .calculate();

    if (distanceToBallCarrier < TOUCHING_DISTANCE.PLAYER) {
      return new PlayerContact(
        player,
        playerPosition,
        playerSpeed,
        ballCarrierPosition,
        ballCarrierSpeed
      );
    }
  }

  return null;
};
