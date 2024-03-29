import client from "..";
import { PlayerObject, TeamId } from "../HBClient";
import { leftpad } from "./utils";

export const getPlayerDiscProperties = (id: number) => {
  // Flattened the native method because we only use speed and and position
  const {
    xspeed = null,
    yspeed = 0,
    x = 0,
    y = 0,
    radius = 0,
  } = client.getPlayerDiscProperties(id) ?? {};
  if (xspeed === null) return null;
  return {
    position: { x, y },
    speed: { x: xspeed, y: yspeed },
    radius,
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

export const getTeamStringFromId = (teamId: TeamId) => {
  if (teamId === 0) return "Spectators";
  if (teamId === 1) return "Red";
  return "Blue";
};
