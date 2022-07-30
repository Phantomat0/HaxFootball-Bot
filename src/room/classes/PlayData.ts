import { Position, TeamId } from "../HBClient";

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

export interface PlayDetails {
  /**
   * The type of play
   */
  type: "Snap" | "Field Goal" | "Kickoff" | "Punt" | "Onside Kick";

  /**
   * The play's transcript
   */
  description: string;

  scoreType?:
    | "Touchdown"
    | "Safety"
    | "Conversion Safety"
    | "Field Goal"
    | "Auto Touchdown"
    | "Two Point Conversion";

  /**
   * Description if it is a field goal or touchdown
   */
  scoreDescription?: string;

  passEndPosition?: Position;
  isIncomplete?: boolean;
  isInterception?: boolean;

  scorer1?: number;
  scorer2?: number;

  redScore?: number;
  blueScore?: number;
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
  yardLine: number;
  mapHalf: Omit<TeamId, 0>;
  losX: number;

  offense: Omit<TeamId, 0>;
  defense: Omit<TeamId, 0>;

  playDetails: Partial<PlayDetails> = {};

  constructor({
    half,
    startTime,
    down,
    yardsToGet,
    yardLine,
    mapHalf,
    losX,
    offense,
  }: {
    half: 1 | 2;
    time: number;
    startTime: number;
    down: 1 | 2 | 3 | 4 | 5;
    yardsToGet: number;
    yardLine: number;
    losX: number;
    mapHalf: Omit<TeamId, 0>;
    offense: Omit<TeamId, 0>;
  }) {
    this.half = half;
    this.startTime = startTime;
    this.down = down;
    this.toGo = yardsToGet;
    this.yardLine = yardLine;
    this.mapHalf = mapHalf;
    this.losX = losX;
    this.offense = offense;
    this.defense = offense === 1 ? 2 : 1;
  }
}
