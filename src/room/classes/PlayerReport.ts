import { TeamId } from "../HBClient";

export interface PlayerReport {
  uuid: null;
  name: string;
  recordId: number;
  auth: string;
  ip: string;
  team: TeamId;
  stats: PlayerReportStats;
}

// Corner, Middle, Deep, Backwards
export interface PlayerReportStats {
  posO: "qb" | "qbwr" | "wr" | "te";
  posD: "cb" | "lb" | "fs" | "lb/fs";
  mp: number;
  result: "w" | "l" | "d" | "fl";
  receiving: {
    rec: [number, number, number, number];
    recYd: [number, number, number, number];
    recYdAc: [number, number, number, number];
    ruAtt: number;
    ruYd: number;
    tdRec: number;
    tdRush: number;
  };
  passing: {
    pa: [number, number, number, number];
    pc: [number, number, number, number];
    pYd: [number, number, number, number];
    pYdD: [number, number, number, number];
    tdT: number;
    int: number;
    qbSak: number;
    disBefPass: number;
    timToPass: number;
    cpa: number;
    cpc: number;
  };
  fgA: number;
  fgYdA: number;
  fgM: number;
  fgYdM: number;
  pen: number;
}
