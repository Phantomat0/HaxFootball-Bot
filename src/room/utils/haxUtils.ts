import { client } from "..";
import { PlayerObject } from "../HBClient";

export const getPlayerDiscProperties = (id: number) => {
  // Flattened the native method because we only use speed and and position
  const { xspeed, yspeed, x, y } = client.getPlayerDiscProperties(id);
  return {
    position: { x, y },
    speed: { x: xspeed, y: yspeed },
  };
};

export const quickPause = () => {
  client.pauseGame(true);
  client.pauseGame(false);
};

export const flattenPlayer = ({ id, team, name }: PlayerObject) => {
  return {
    id,
    team,
    name,
  };
};
