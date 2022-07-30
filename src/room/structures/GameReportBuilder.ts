import { TeamId } from "../HBClient";

export default class GameReportBuilder {}

interface ScoringSummaryItem {
  half: 1 | 2;
  time: number;
  redScore: number;
  blueScore: number;
  description: number;
  driveDuration: number;
  numbPlays: number;
  type: string;
  scorer1: string;
  scorer2: string;
}

interface GameReport {
  winningTeam: TeamId;
  gameStats: {
    duration: number;
    redScore: number;
    blueScore: number;
    scoringSummary: ScoringSummaryItem[];
  };
}
