import { PlayableTeamId, PlayerObjFlat, Position } from "../HBClient";
import { MAP_POINTS } from "../utils/map";
import { plural, truncateName } from "../utils/utils";
import DistanceCalculator, { DistanceConverter } from "./DistanceCalculator";
import MapReferee from "./MapReferee";

interface Penalty {
  message: string;
  fullName: string;
  netYards: number;
  addDown: boolean;
  hasOwnHandler?: boolean;
  delay?: boolean;
}

export interface AdditionalPenaltyData {
  time?: number;
}

export type PenaltyName =
  | "snapOutOfHashes"
  | "snapOutOfBounds"
  | "offsidesOffense"
  | "offsidesDefense"
  | "crowding"
  | "crowdAbuse"
  | "illegalPass"
  | "snapDrag"
  | "intentionalGrounding"
  | "fgDrag"
  | "puntDrag"
  | "onsideKickDrag"
  | "puntOffsidesOffense"
  | "illegalTouch"
  | "illegalRun"
  | "illegalLosCross"
  | "illegalBlitz"
  | "illegalPush"
  | "kickOffDrag"
  | "kickOffDragSafety"
  | "kickOffOutOfBounds"
  | "kickOffOffsides"
  | "kickOffOffsidesSafety";

export default class PenaltyDataGetter {
  private _getPenalty<T extends PenaltyName>(
    penaltyName: T,
    player: PlayerObjFlat,
    penaltyData: AdditionalPenaltyData
  ) {
    // Adjust time so it doesn't read "penalty at 0 seconds"
    const { time: timeNotAdjusted = 1 } = penaltyData;
    const time = timeNotAdjusted === 0 ? 1 : timeNotAdjusted;

    // If we have a player defined, truncate his name
    const playerName = truncateName(player.name);

    const PENALTIES: Record<PenaltyName, Penalty> = {
      snapOutOfHashes: {
        fullName: "Illegal Snap, Out Of Hashes",
        message: `Illegal Snap, Out Of Hashes by ${playerName}, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      snapOutOfBounds: {
        fullName: "Illegal Snap, Out of Bounds",
        message: `Illegal Snap, Out of Bounds, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      offsidesOffense: {
        fullName: "Offsides Offense",
        message: `Offsides Offense ${playerName}, 10 yard penalty, repeat the down`,
        netYards: -10,
        addDown: false,
      },
      offsidesDefense: {
        fullName: "Offsides Defense",
        message: `Offsides Defense ${playerName}, 10 yard penalty, repeat the down`,
        netYards: 10,
        addDown: false,
      },
      snapDrag: {
        fullName: "Quarterback Drag",
        message: `Quarterback Drag, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      intentionalGrounding: {
        fullName: "Intentional Grounding",
        message: `Intentional Grounding, 10 yard penalty, automatic loss of down`,
        netYards: -10,
        addDown: true,
      },
      crowding: {
        fullName: "Crowding",
        message: `Crowding ${playerName}, 10 yard penalty, repeat the down`,
        netYards: 10,
        addDown: false,
        delay: true,
      },
      crowdAbuse: {
        fullName: "Crowd Abuse",
        message: `Crowd Abuse ${playerName}, 15 yard penalty, repeat the down`,
        netYards: 15,
        addDown: false,
        delay: true,
      },

      illegalPass: {
        fullName: "Illegal Pass In Front Of Line Of Scrimmage",
        message: `Illegal Pass In Front Of Line Of Scrimmage, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      fgDrag: {
        fullName: "Field Goal Kick Drag",
        message: `Field Goal Kick Drag, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      puntDrag: {
        fullName: "Punt Kick Drag",
        message: `Punt Kick Drag, 10 yard penalty, repeat the down`,
        netYards: -10,
        addDown: false,
      },
      puntOffsidesOffense: {
        fullName: "Punt Offsides Offense",
        message: `Offsides Offense, 10 yard penalty, repeat the down`,
        netYards: -10,
        addDown: false,
      },
      illegalTouch: {
        fullName: "Illegal Touching Of The Ball",
        message: `Illegal Touching Of The Ball by ${playerName}, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      illegalRun: {
        fullName: "Illegal Run",
        message: `Illegal Run by ${playerName}, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      illegalLosCross: {
        fullName: "Illegal Line Of Scrimmage Cross",
        message: `${playerName} illegally crossed the line of scrimmage, automatic loss of down`,
        netYards: 0,
        addDown: true,
      },
      illegalBlitz: {
        fullName: "Illegal blitz",
        message: `Illegal blitz by ${playerName} at ${plural(
          Math.round(time),
          "second",
          "seconds"
        )}, 10 yard penalty, repeat the down`,
        netYards: 10,
        addDown: false,
      },
      illegalPush: {
        fullName: "Illegal Push",
        message: `Illegal Pushing by ${playerName} , 10 yard penalty, repeat the down`,
        netYards: -10,
        addDown: false,
      },
      // These have their own handlers
      onsideKickDrag: {
        fullName: "Onside Kick Drag",
        message: `Onside Kick Drag, automatic receiving team 40 yard line`,
        netYards: 0,
        addDown: false,
        hasOwnHandler: true,
      },
      kickOffDrag: {
        fullName: "Kickoff Drag",
        message: `Kickoff Drag, automatic receiving team 40 yard line`,
        netYards: 0,
        addDown: false,
        hasOwnHandler: true,
      },
      kickOffDragSafety: {
        fullName: "Safety Punt Drag",
        message: `Punt Drag after a safety, automatic defense 40 yard line`,
        netYards: 0,
        addDown: false,
        hasOwnHandler: true,
      },
      kickOffOutOfBounds: {
        fullName: "Kickoff kicked out of bounds",
        message: `Kickoff kicked out of bounds, automatic offense 40 yard line`,
        netYards: 0,
        addDown: false,
        hasOwnHandler: true,
      },
      kickOffOffsides: {
        fullName: "Kickoff Offsides Offense",
        message: `Offsides Offense ${playerName}, automatic offense 40 yard line`,
        netYards: 0,
        addDown: false,
        hasOwnHandler: true,
      },
      kickOffOffsidesSafety: {
        fullName: "Safety Punt Offsides Offense",
        message: `Offsides Offense ${playerName} after a safety, automatic defense 40 yard line`,
        netYards: 0,
        addDown: false,
        hasOwnHandler: true,
      },
    };
    return PENALTIES[penaltyName];
  }

  /**
   * Prevents a penalty causing the LOS to be set at the 0
   */
  private _maybeConstrainNewEndLosXToOneYardLine(losX: number) {
    const endZoneLosXIsIn = MapReferee.getEndZonePositionIsIn({
      x: losX,
      y: 0,
    });

    // If its not in the endzone or at the 0, just return it
    if (endZoneLosXIsIn === null) return losX;

    // Otherwise get the one yardline of that endzone

    const teamsEndzone = MapReferee.getTeamEndzone(endZoneLosXIsIn);

    const teamsEndZoneOneYardLine = new DistanceCalculator()
      .addByTeam(teamsEndzone, MAP_POINTS.YARD * 1, endZoneLosXIsIn)
      .calculate();

    return teamsEndZoneOneYardLine;
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
      fullName,
      delay,
    } = this._getPenalty(penaltyName, player, penaltyData);

    const isRedZonePenaltyOnDefense = isInDefenseRedzone && netYards > 0;

    const losYardLine = DistanceConverter.toYardLine(losX);

    // Adjust the netyards line if we are in the redzone, always half distance to LOS
    const adjustedNetYards = isRedZonePenaltyOnDefense
      ? Math.floor(losYardLine / 2)
      : netYards;

    // Ok now lets get the new LOS x
    const newEndLosX = new DistanceCalculator()
      .addByTeam(losX, adjustedNetYards * MAP_POINTS.YARD, offenseTeamId)
      .calculate();

    const constrainedLosXInCaseEndsInEndzone =
      this._maybeConstrainNewEndLosXToOneYardLine(newEndLosX);

    // Check if the constrained LosX is in the offense team's own endzone
    // otherwise they can get infinite penalties and waste time
    // So we should add down in that case
    const offenseEndzone = MapReferee.getTeamEndzone(offenseTeamId);

    const offenseOneYardLine = new DistanceCalculator()
      .addByTeam(offenseEndzone, MAP_POINTS.YARD * 1, offenseTeamId)
      .calculate();

    const addDownBecausePenaltyAtOwnOneYard =
      constrainedLosXInCaseEndsInEndzone === offenseOneYardLine;

    return {
      penaltyYards: adjustedNetYards,
      isRedZonePenaltyOnDefense,
      newEndLosX: constrainedLosXInCaseEndsInEndzone,
      addDown: addDown || addDownBecausePenaltyAtOwnOneYard,
      hasOwnHandler,
      penaltyMessage: message,
      fullName,
      delay,
    };
  }
}
