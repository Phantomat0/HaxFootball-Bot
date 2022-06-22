// interface PassIncompleteData {
//   mapLocation: string;
//   intentedTarget: string;
// }

// interface IGameEvents {
//   passComplete: {};
//   passOutOfBounds: PassIncompleteData;
//   passDeflected: PassIncompleteData & { deflector: string };
//   qbRun: {
//     mapLocation: string;
//     netYards: number;
//   };
//   tackle: {
//     tackler: string;
//   };
//   runTackle: {
//     tackler1: string;
//     tackler2: string;
//     isSameTackler: boolean;
//   };
// }

/*
EVENTS

// Passes
- Pass Complete
- Pass out of bounds
- Pass swatted

// Rushing
- QB goes out of bounds
- Rushing attempt out of bounds
- Rushing attempt scored TD
- Rushing attempt tackled

// Field Goal
- Field goal Inc (miss)
- Field goal Inc (touched offense)
- Field goal Good (on target)
- Field goal Good (touched defense)
- Field goal rush scored TD
- Field goal rush out of bounds
- Field goal tackled
- Field goal sacked
- Field goal run



log()


PASS
isCatch
receiver
intendedTarget
quarterback
mapSection







*/

// class GameReporter {
//   private _gameEvents: any[] = [];

//   logEvent<T extends keyof GameEvents[]>(eventNames: T, eventData: ) {}
// }
