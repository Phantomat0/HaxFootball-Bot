import { PlayableTeamId, PlayerObjFlat, Position } from "../HBClient";
import { MAP_POINTS } from "../utils/map";
import { plural, truncateName } from "../utils/utils";
import DistanceCalculator, { DistanceConverter } from "./DistanceCalculator";

interface Penalty {
  message: string;
  netYards: number;
  addDown: boolean;
  hasOwnHandler?: boolean;
}

export interface AdditionalPenaltyData {
  time?: number;
}

export type PenaltyName =
  | "snapOutOfHashes"
  | "snapOutOfBounds"
  | "offsidesOffense"
  | "offsidesDefense"
  | "snapDrag"
  | "fgDrag"
  | "puntDrag"
  | "illegalTouch"
  | "illegalRun"
  | "illegalLosCross"
  | "illegalBlitz"
  | "kickOffDrag"
  | "kickOffDragSafety"
  | "kickOffOutOfBounds"
  | "kickOffOutOfBoundsSafety"
  | "kickOffOffsides"
  | "kickOffOffsidesSafety";

export default class PenaltyDataGetter {
  private _getPenalty<T extends PenaltyName>(
    penaltyName: T,
    player: PlayerObjFlat,
    penaltyData: AdditionalPenaltyData
  ) {
    const { time = 0 } = penaltyData;

    // If we have a player defined, truncate his name
    const playerName = truncateName(player.name);

    const PENALTIES: Record<PenaltyName, Penalty> = {
      snapOutOfHashes: {
        message: `Illegal Snap, Out Of Hashes, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      snapOutOfBounds: {
        message: `Illegal Snap, Out of Bounds, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      offsidesOffense: {
        message: `Offsides Offense ${playerName}, 10 yard penalty, repeat the down`,
        netYards: -10,
        addDown: false,
      },
      offsidesDefense: {
        message: `Offsides Defense ${playerName}, 10 yard penalty, repeat the down`,
        netYards: 10,
        addDown: false,
      },
      snapDrag: {
        message: `Quarterback Drag, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      fgDrag: {
        message: `Field Goal Kick Drag, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      puntDrag: {
        message: `Punt Kick Drag, 10 yard penalty, repeat the down`,
        netYards: -10,
        addDown: false,
      },
      illegalTouch: {
        message: `Illegal touching of the ball by ${playerName}, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      illegalRun: {
        message: `Illegal run by ${playerName}, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      illegalLosCross: {
        message: `${playerName} illegally crossed the line of scrimmage, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      illegalBlitz: {
        message: `Illegal blitz by ${playerName} at ${plural(
          Math.round(time),
          "second",
          "seconds"
        )}, 10 yard penalty, repeat the down`,
        netYards: 10,
        addDown: false,
      },
      // These have their own handlers
      kickOffDrag: {
        message: `Kickoff Drag, automatic offense 40 yard line`,
        netYards: 0,
        addDown: false,
        hasOwnHandler: true,
      },
      kickOffDragSafety: {
        message: `Kickoff Drag after a safety, automatic defense 40 yard line`,
        netYards: 0,
        addDown: false,
        hasOwnHandler: true,
      },
      kickOffOutOfBounds: {
        message: `Kickoff kicked out of bounds, automatic offense 40 yard line`,
        netYards: 0,
        addDown: false,
        hasOwnHandler: true,
      },
      kickOffOutOfBoundsSafety: {
        message: `Kickoff kicked out of bounds after a safety, automatic defense 40 yard line`,
        netYards: 0,
        addDown: false,
        hasOwnHandler: true,
      },
      kickOffOffsides: {
        message: `Offsides Offense ${playerName}, automatic offense 40 yard line`,
        netYards: 0,
        addDown: false,
        hasOwnHandler: true,
      },
      kickOffOffsidesSafety: {
        message: `Offsides Offense ${playerName} after a safety, automatic defense 40 yard line`,
        netYards: 0,
        addDown: false,
        hasOwnHandler: true,
      },
    };
    return PENALTIES[penaltyName];
  }

  getData<T extends PenaltyName>(
    penaltyName: T,
    player: PlayerObjFlat,
    isInDefenseRedzone: boolean,
    losX: Position["x"],
    offenseTeamId: PlayableTeamId,
    penaltyData: AdditionalPenaltyData
  ) {
    const {
      netYards,
      addDown,
      hasOwnHandler = false,
      message,
    } = this._getPenalty(penaltyName, player, penaltyData);

    const isRedZonePenaltyOnDefense = isInDefenseRedzone && netYards > 0;

    const losYardLine = DistanceConverter.toYardLine(losX);

    // Adjust the netyards line if we are in the redzone, always half distance to LOS
    const adjustedNetYards = isRedZonePenaltyOnDefense
      ? Math.floor(losYardLine / 2)
      : netYards;

    console.log({
      adjustedNetYards,
      losX,
      isRedZonePenaltyOnDefense,
    });
    // Ok now lets get the new LOS x
    const newEndLosX = new DistanceCalculator()
      .addByTeam(losX, adjustedNetYards * MAP_POINTS.YARD, offenseTeamId)
      .calculate();

    return {
      penaltyYards: adjustedNetYards,
      isRedZonePenaltyOnDefense,
      newEndLosX,
      addDown,
      hasOwnHandler,
      penaltyMessage: message,
    };
  }
}

// const handlePenalty = (penaltyObj) => {
//   quickPause();
//   game.setLivePlay(false);

//   const { type, playerName = "" } = penaltyObj;

//   const { time } = room.getScores();

//   const penalty = PENALTIES.find((penalty) => penalty.name === type);

//   const { description, netYards, addDown } = penalty;

//   Chat.send(`${ICONS.YellowSquare} ${description}`);

//   // The play's handler already does the work
//   if (penalty.hasOwnProperty("hasOwnHandler")) return;

//   const getAdjustedNetYardsForRedzone = () => {
//     const LOSYard = new DistanceCalculator(down.getLOS()).getYardLine();
//     return Math.floor(LOSYard / 2);
//   };

//   const endPosition = new DistanceCalculator([
//     down.getLOS(),
//     adjustedNetYards * MAP.YARD,
//   ])
//     .addByTeam(game.getOffenseTeam())
//     .getDistance();

//   const incrementRedZonePenalty = () => {
//     if (!isRedZonePenaltyOnDefense) return;
//     const currentValue = down.getState("redZonePenaltyCounter") ?? 0; // Set it to 0 initially
//     down.setState("redZonePenaltyCounter", currentValue + 1);
//   };

//   incrementRedZonePenalty();

//   const PENALTY_COUNTER_AUTO_TOUCHDOWN = 3;

//   if (down.getState("redZonePenaltyCounter") === PENALTY_COUNTER_AUTO_TOUCHDOWN)
//     return play.handleAutoTouchdown();

//   play.endPlay({
//     netYards: adjustedNetYards,
//     endPosition: endPosition,
//     addDown: addDown,
//   });
// };

// SnapCheckForPenalties() {
//   const snapOutOfBoundsCheck = () => {
//     const { position } = getPlayerDiscProperties(this._quarterback.id);
//     const isOutOfBounds = checkIfOutOfBounds(position, MAP.PLAYER_RADIUS);
//     return isOutOfBounds ? { type: PENALTY_TYPES.SNAP_OUT_OF_BOUNDS } : null;
//   };

//   const snapOutsideHashesCheck = () => {
//     const { position } = getPlayerDiscProperties(this._quarterback.id);
//     const withinHash = checkIfWithinHash(position, MAP.PLAYER_RADIUS);
//     return withinHash ? null : { type: PENALTY_TYPES.SNAP_OUT_OF_HASHES };
//   };

//   const checkOffsideOffense = () => {
//     const { offensePlayers } = game.getOffenseDefensePlayers();
//     const offensiveTeam = game.getOffenseTeam();
//     const offsidePlayer = getOffsidePlayer(offensePlayers, offensiveTeam);
//     return Boolean(offsidePlayer)
//       ? {
//           type: PENALTY_TYPES.OFFSIDES_OFFENSE,
//           playerName: offsidePlayer.name,
//         }
//       : null;
//   };

//   const checkOffsideDefense = () => {
//     const { defensePlayers } = game.getOffenseDefensePlayers();
//     const defensiveTeam = game.getDefenseTeam();
//     const offsidePlayer = getOffsidePlayer(defensePlayers, defensiveTeam);
//     return Boolean(offsidePlayer)
//       ? {
//           type: PENALTY_TYPES.OFFSIDES_DEFENSE,
//           playerName: offsidePlayer.name,
//         }
//       : null;
//   };

//   // Put it in an array so we can control the order of the functions
//   const penaltyArray = [
//     snapOutOfBoundsCheck(),
//     snapOutsideHashesCheck(),
//     checkOffsideOffense(),
//     checkOffsideDefense(),
//   ];

//   const penaltyObj = penaltyArray.find(
//     (penalty) => Boolean(penalty) === true
//   );

//   if (Boolean(penaltyObj)) {
//     handlePenalty(penaltyObj);
//     return true;
//   }
//   return false;
// }
