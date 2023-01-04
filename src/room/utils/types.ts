export const TEAMS = {
  SPECTATORS: 0,
  RED: 1,
  BLUE: 2,
} as const;

export const TEAM_OBJ = {
  SPECTATORS: {
    id: 0,
    name: "Spectators",
  },
  RED: {
    id: 1,
    name: "Red",
  },
  BLUE: {
    id: 2,
    name: "Blue",
  },
} as const;
