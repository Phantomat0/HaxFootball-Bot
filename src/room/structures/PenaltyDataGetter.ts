import { PlayableTeamId, PlayerObjFlat, Position } from "../HBClient";
import { MAP_POINTS } from "../utils/map";
import { plural, truncateName } from "../utils/utils";
import DistanceCalculator, { DistanceConverter } from "./DistanceCalculator";
import MapReferee from "./MapReferee";

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
  | "crowding"
  | "crowdAbuse"
  | "illegalPass"
  | "snapDrag"
  | "fgDrag"
  | "puntDrag"
  | "onsideKickDrag"
  | "puntOffsidesOffense"
  | "illegalTouch"
  | "illegalRun"
  | "illegalLosCross"
  | "illegalBlitz"
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
      crowding: {
        message: `Crowding ${playerName}, 15 yard penalty, repeat the down`,
        netYards: 15,
        addDown: false,
      },
      crowdAbuse: {
        message: `Crowd Abuse ${playerName}, 20 yard penalty, repeat the down`,
        netYards: 20,
        addDown: false,
      },
      illegalPass: {
        message: `Illegal Pass in front of the line of scrimmage, automatic loss of down`,
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
      puntOffsidesOffense: {
        message: `Offsides Offense, 10 yard penalty, repeat the down`,
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
      onsideKickDrag: {
        message: `Onside Kick Drag, automatic receiving team 40 yard line`,
        netYards: 0,
        addDown: false,
        hasOwnHandler: true,
      },
      kickOffDrag: {
        message: `Kickoff Drag, automatic receiving team 40 yard line`,
        netYards: 0,
        addDown: false,
        hasOwnHandler: true,
      },
      kickOffDragSafety: {
        message: `Punt Drag after a safety, automatic defense 40 yard line`,
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

    // Check if the constained LosX is in the offense team's own endzone
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
    };
  }
}
