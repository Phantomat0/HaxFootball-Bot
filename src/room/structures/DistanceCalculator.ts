import { TEAMS } from "..";
import { PlayableTeamId, Position } from "../HBClient";
import { MAP_POINTS } from "../utils/map";
import MapReferee from "./MapReferee";

// ====================== -775 ====================
// -775 ================== 0 ================== 775
// ====================== 775 ====================

export class DistanceConverter {
  static toYardLine(distance: number) {
    return (MAP_POINTS.HALF_FIELD - Math.abs(distance)) / MAP_POINTS.YARD;
  }

  static toYard(distance: number) {
    return distance / MAP_POINTS.YARD;
  }
}

export default class DistanceCalculator {
  private _calculation: number;

  constructor(initialCalculation = 0) {
    this._calculation = initialCalculation;
  }

  /**
   * Calculates the absolute difference between two numbers
   */
  calcDifference2D(p1: number, p2: number): this {
    this._calculation = Math.abs(p1 - p2);
    return this;
  }

  /**
   * Calculates the distance between two points
   */
  calcDifference3D(p1: Position, p2: Position): this {
    const d1 = p1.x - p2.x;
    const d2 = p1.y - p2.y;
    this._calculation = Math.hypot(d1, d2);
    return this;
  }

  /**
   * Calculated the net difference between two numbers, adjusted for each team based on the map coordinates.
   * I.e 300 - 150 for red team will return -150 because they moved back
   */
  calcNetDifferenceByTeam(
    p1: number,
    p2: number,
    teamId: PlayableTeamId
  ): this {
    const difference = p1 - p2;

    // We need to get the net difference, and that varies by team since net for blue is from positive to negative
    if (teamId === TEAMS.RED) {
      if (difference > 0) {
        this._calculation = -difference;
      }
      if (difference < 0) {
        this._calculation = Math.abs(difference);
      }
    } else {
      this._calculation = difference;
    }

    return this;
  }

  /**
   * Difference between two numbers, depending on the team
   * @teamId RED p1 - p2
   * @teamId BLUE p2 - p1
   */
  subtractByTeam(p1: number, p2: number, teamId: PlayableTeamId) {
    this._calculation = teamId === TEAMS.RED ? p1 - p2 : p1 + p2;
    return this;
  }

  /**
   * Sum of two numbers, depending on team
   * @teamId RED p1 + p2
   * @teamId BLUE p1 - p2
   */
  addByTeam(p1: number, p2: number, teamId: PlayableTeamId) {
    this._calculation = teamId === TEAMS.RED ? p1 + p2 : p1 - p2;
    return this;
  }

  /**
   * Constrains calculation to be between -775 and 775
   * Used when we dont care about distance after the endzone
   */
  constrainToEndzonePoints() {
    const rounded =
      this._calculation >= 0
        ? Math.min(this._calculation, MAP_POINTS.BLUE_ENDZONE)
        : Math.max(this._calculation, MAP_POINTS.RED_ENDZONE);
    this._calculation = rounded;
    return this;
  }

  /**
   * Rounds our calculation if the calculation is between 0 and 1 yardline. In that case we will always round to the one yard liine
   * @teamId RED Round to -759.5
   * @teamId BLUE Round to 759.5
   */
  roundToTeamEndzone(teamId: PlayableTeamId) {
    // We always round to the back of the player, but this can result
    // us in rounding to their endzone and causing a safety. We dont want that, so always to
    // the front in those cases.

    const teamsEndzone = MapReferee.getTeamEndzone(teamId);

    const oneYardLinePoint = new DistanceCalculator()
      .addByTeam(teamsEndzone, MAP_POINTS.YARD, teamId)
      .calculate();

    const isBehindOneYardLine = MapReferee.checkIfBehind(
      this._calculation,
      oneYardLinePoint,
      teamId
    );
    const isInFrontOfEnzone = MapReferee.checkIfInFront(
      this._calculation,
      teamsEndzone,
      teamId
    );

    // If it is, change the calculation to the one yard line point, otherwise leave it be
    const isBetweenZeroAndOneYardLine =
      isBehindOneYardLine && isInFrontOfEnzone;
    if (isBetweenZeroAndOneYardLine) {
      this._calculation = oneYardLinePoint;
    }

    return this;
  }

  /**
   * Round our calculation to the nearest yard, rounding up or down depending on the team
   * @teamId RED Round Down
   * @teamId BLUE Round Up
   */
  roundToYardByTeam(teamId: PlayableTeamId) {
    const { YARD } = MAP_POINTS;

    // Round down for red, round up for blue
    this._calculation =
      teamId === TEAMS.RED
        ? YARD * Math.floor(this._calculation / YARD)
        : YARD * Math.ceil(this._calculation / YARD);

    return this;
  }

  /**
   * Returns the final calculation
   */
  calculate() {
    console.log(this._calculation);
    return this._calculation;
  }

  calculateAndConvert() {
    console.log(this._calculation);
    return {
      distance: this._calculation,
      yards: DistanceConverter.toYard(this._calculation),
      yardLine: DistanceConverter.toYardLine(this._calculation),
    };
  }
}
