import { TeamId } from "../HBClient";

interface TeamIdEnum {
  SPECTATORS: TeamId;
  RED: TeamId;
  BLUE: TeamId;
}

export const TEAMS: TeamIdEnum = {
  SPECTATORS: 0,
  RED: 1,
  BLUE: 2,
};
