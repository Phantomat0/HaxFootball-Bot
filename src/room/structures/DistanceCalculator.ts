import { Position } from "../HBClient";

export default class DistanceCalculator {
  calcDifference2D(p1: number, p2: number) {
    return Math.abs(p1 - p2);
  }

  calcDifference3D(p1: Position, p2: Position) {
    const d1 = p1.x - p2.x;
    const d2 = p1.y - p2.y;
    return Math.hypot(d1, d2);
  }
}
