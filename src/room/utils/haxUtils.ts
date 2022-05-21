import { client } from "..";
import { PlayerObject } from "../HBClient";
import { leftpad } from "./utils";

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

export const toClock = (secs: number) => {
  const seconds = Math.floor(secs);
  return `${Math.floor(seconds / 60)}:${leftpad(seconds % 60)}`;
};
