// interface PlayDetails {
//   /**
//    * The type of play that was ran
//    */
//   type: string;

//   isSack: boolean;
//   isTouchdown: boolean;
//   isFumble: boolean;
//   isInterception: boolean;
//   isPenalty: boolean;

//   penaltyTeam: 1 | 2;
//   penaltyType: string;
//   penaltyYards: string;
//   penaltyPlayer: string;
// }

// export class GameEvent {
//   /**
//    * The game half
//    */
//   half: 1 | 2;

//   /**
//    * Game time rounded to integer
//    */
//   gameTime: number;

//   /**
//    * Current down
//    */
//   down: 1 | 2 | 3 | 4;

//   /**
//    * Yards to gain for first down
//    */
//   toGo: number;

//   /**
//    * Location of the LOS
//    */
//   mapLocation: {
//     yardLine: number;
//     half: 1 | 2;
//     yardLineHalfStr: string;
//   };

//   /**
//    * The play's transcript
//    */
//   description: string;

//   offense: 1 | 2;
//   defense: 1 | 2;
//   offenseScore: number;
//   defenseScore: number;

//   /**
//    * Yards the LOS moved
//    */
//   netYards: number;

//   constructor(
//     half: 1 | 2,
//     time: number,
//     down: 1 | 2 | 3 | 4,
//     yardsToGet: number,
//     mapLocation: string,
//     transcript: string
//   ) {
//     this.half = half;
//     this.gameTime = time;
//     this.down = down;
//     this.toGo = yardsToGet;
//   }
// }
