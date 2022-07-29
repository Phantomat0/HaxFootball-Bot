// interface PlayDetails {
//   /**
//    * The type of play that was ran
//    */
//   type: string;

import { Position } from "../HBClient";

//   isSack: boolean;
//   isTouchdown: boolean;
//   isInterception: boolean;
//   isPenalty: boolean;

//   penaltyTeam: 1 | 2;
//   penaltyType: string;
//   penaltyYards: string;
//   penaltyPlayer: string;
// }

/* 
= SNAP =
✅ CATCH |  M. Stafford pass top corner to Dime
✅ Incomplete | M. Stafford pass incomplete bottom corner intended for Dime (Michael Vick)
✅ Tackle | tackled at BLUE 24 for 20 yards (Michael Vick)
✅ Run | geoff run
✅ Steps out Of Bounds | steps out of bounds at BLUE 23 for 20 yards
✅ Touchdown | 34 yard touchdown off a 
✅ PICK SIX | 34 yard pick six off a 
✅ Interception | M, Stafford pass intercepted by Michael Vick at BLUE 23
✅ SACK | M. Stafford sacked at the BLUE 24 for -24 yards

= Field Goal = 
Incomplete | Michael Vick 34 yard field goal attempt is NO GOOD
Good | Michael Vick 34 yard field goal attempt is GOOD

= Punt / Kickoff = 
Kickoff | Dime kicks off to the BLUE 24
Punt | Dime punts to the RED endzone
PuntKickoff catch | geoff to RED 38 for 19 yards
Touchback | Touchback
Safety | Safety
*/

interface PlayDetailsBase {
  /**
   * The type of play
   */
  type: "Snap" | "Punt" | "Kickoff" | "Two Point Attempt" | "Field Goal";

  /**
   * The play's transcript
   */
  description: string;

  /**
   * Yards the LOS moved
   */
  netYards: number;

  /**
   * Whether or not the play resulted in a touchdown
   */
  isTouchdown: boolean;

  /**
   * Whether or not the play ended in a safety
   */
  isSafety: boolean;

  /**
   * Description if it is a field goal or touchdown
   */
  scoringDescription?: string;
}

export interface SnapPlayDetails extends PlayDetailsBase {
  snapPlayType: "Pass" | "Run" | "Scramble";
  quarterback: number;
  receiverOrRusher: number | null;
  isIncomplete: boolean;
  isInterception: boolean;
  passEndPosition: Position | null;
}

export interface FieldGoalPlayDetails extends PlayDetailsBase {
  isGood: boolean;
}

export default class PlayData {
  /**
   * The game half
   */
  half: 1 | 2;

  /**
   * Half time when the play started rounded to integer
   */
  startTime: number;

  /**
   * Half time when the play ended rounded to integer
   */
  endTime: number;

  /**
   * Duration of the event
   */
  duration: number;

  /**
   * Current down
   */
  down: 1 | 2 | 3 | 4 | 5;

  /**
   * Yards to gain for first down
   */
  toGo: number;

  /**
   * Location of the LOS
   */
  mapLocation: {
    yardLine: number;
    half: 1 | 2;
  };

  playDetails: Partial<PlayDetailsBase> = {};

  //   offense: 1 | 2;
  //   defense: 1 | 2;
  //   offenseScore: number;
  //   defenseScore: number;

  constructor({
    half,
    startTime,
    down,
    yardsToGet,
    mapLocation,
  }: {
    half: 1 | 2;
    time: number;
    startTime: number;
    down: 1 | 2 | 3 | 4 | 5;
    yardsToGet: number;
    mapLocation: {
      yardLine: number;
      half: 1 | 2;
    };
  }) {
    this.half = half;
    this.startTime = startTime;
    this.down = down;
    this.toGo = yardsToGet;
    this.mapLocation = mapLocation;
  }
}
