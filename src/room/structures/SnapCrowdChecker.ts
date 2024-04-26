import client from "..";
import { PlayableTeamId, PlayerObject } from "../HBClient";
import Room from "../roomStructures/Room";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import { DISC_IDS, MAP_POINTS } from "../utils/map";
import { TEAMS } from "../utils/types";
import { isInRectangleArea } from "../utils/utils";
import DistanceCalculator, { DistanceConverter } from "./DistanceCalculator";
import MapReferee from "./MapReferee";

class PlayerCrowdData {
  playerId: PlayerObject["id"];
  timeGotInCrowdBox: number;
  playerTeam: PlayableTeamId;
  wasAlone: boolean;

  constructor(
    playerId: PlayerObject["id"],
    playerTeam: PlayableTeamId,
    timeGotInCrowdBox: number,
    wasAlone: boolean
  ) {
    this.playerId = playerId;
    this.playerTeam = playerTeam;
    this.timeGotInCrowdBox = timeGotInCrowdBox;
    this.wasAlone = wasAlone;
  }
}

export default class SnapCrowdChecker {
  private CROWD_BOX_YARDS_FRONT: number = 6;
  private CROWD_BOX_YARDS_BEHIND: number = 5;
  private MAX_CROWDING_SECONDS: number = 3;
  private MAX_CROWD_ABUSE_SECONDS: number = 2.2;

  private _playersInCrowdBoxList: PlayerCrowdData[] = [];
  private _offenseTeamId: PlayableTeamId;
  private _playCrowdBoxArea: { x1: number; y1: number; x2: number; y2: number };

  checkPlayersInCrowdBox(
    players: PlayerObject[],
    time: number
  ): {
    isCrowding: boolean;
    crowder: PlayerObject | null;
    crowdingData: PlayerCrowdData | null;
  } {
    const crowder = players.find((player) => {
      const inCrowd = this._checkIfPlayerInCrowdBox(player.id);
      if (inCrowd) {
        const index = this._addToCrowdBoxIfNotAlready(player, time);
        const isCrowding = this._checkIfMeetsCrowdingCriteria(index, time);
        if (isCrowding) return true;
      } else {
        this._maybeRemoveFromCrowdBoxList(player.id);
      }
      return false;
    });

    if (crowder) {
      const crowdingData = this._playersInCrowdBoxList.find(
        (crowdData) => crowdData.playerId === crowder.id
      )!;

      return {
        isCrowding: true,
        crowder: crowder,
        crowdingData: crowdingData,
      };
    }

    return {
      isCrowding: false,
      crowder: null,
      crowdingData: null,
    };
  }

  setOffenseTeam(offenseTeamId: PlayableTeamId) {
    this._offenseTeamId = offenseTeamId;
  }

  drawCrowdBoxLines() {
    // Front
    client.setDiscProperties(DISC_IDS.CROWD_BOX[0], {
      x: this._playCrowdBoxArea.x1,
      y: MAP_POINTS.TOP_HASH,
    });
    client.setDiscProperties(DISC_IDS.CROWD_BOX[1], {
      x: this._playCrowdBoxArea.x1,
      y: MAP_POINTS.BOT_HASH,
    });

    // Back
    client.setDiscProperties(DISC_IDS.CROWD_BOX[2], {
      x: this._playCrowdBoxArea.x2,
      y: MAP_POINTS.BOT_HASH,
    });
    client.setDiscProperties(DISC_IDS.CROWD_BOX[3], {
      x: this._playCrowdBoxArea.x2,
      y: MAP_POINTS.TOP_HASH,
    });
  }

  eraseCrowdBoxLines() {
    // Front
    client.setDiscProperties(DISC_IDS.CROWD_BOX[0], {
      x: MAP_POINTS.HIDDEN,
      y: MAP_POINTS.TOP_HASH,
    });
    client.setDiscProperties(DISC_IDS.CROWD_BOX[1], {
      x: MAP_POINTS.HIDDEN,
      y: MAP_POINTS.BOT_HASH,
    });

    // Back
    client.setDiscProperties(DISC_IDS.CROWD_BOX[2], {
      x: MAP_POINTS.HIDDEN,
      y: MAP_POINTS.TOP_HASH,
    });
    client.setDiscProperties(DISC_IDS.CROWD_BOX[3], {
      x: MAP_POINTS.HIDDEN,
      y: MAP_POINTS.BOT_HASH,
    });
  }

  /**
   *
   * Don't extend crowd box into endzone
   */
  private _determineCrowdBoxFrontYards(losX: number) {
    const losYardLine = DistanceConverter.toYardLine(losX);
    const isNextToEndzone = losYardLine <= this.CROWD_BOX_YARDS_FRONT;

    const teamLosIsIn = MapReferee.getMapHalfFromPoint(losX);

    // TeamLosIsIn could return 0 if its at the 0
    const isInDefenseEndzone =
      teamLosIsIn && teamLosIsIn !== this._offenseTeamId;

    if (isNextToEndzone && isInDefenseEndzone) return losYardLine;
    return this.CROWD_BOX_YARDS_FRONT;
  }

  setCrowdBoxArea(losX: number) {
    const crowdBoxFrontYards = this._determineCrowdBoxFrontYards(losX);

    const crowdBoxFront = new DistanceCalculator()
      .addByTeam(
        losX,
        MAP_POINTS.YARD * crowdBoxFrontYards,
        this._offenseTeamId
      )
      .calculate();

    const crowdBoxBehind = new DistanceCalculator()
      .subtractByTeam(
        losX,
        MAP_POINTS.YARD * this.CROWD_BOX_YARDS_BEHIND,
        this._offenseTeamId
      )
      .calculate();

    if (this._offenseTeamId === TEAMS.RED) {
      const boxArea = {
        x1: crowdBoxBehind,
        y1: MAP_POINTS.TOP_HASH,
        x2: crowdBoxFront,
        y2: MAP_POINTS.BOT_HASH,
      };

      this._playCrowdBoxArea = boxArea;
    } else {
      const boxArea = {
        x1: crowdBoxFront,
        y1: MAP_POINTS.TOP_HASH,
        x2: crowdBoxBehind,
        y2: MAP_POINTS.BOT_HASH,
      };

      this._playCrowdBoxArea = boxArea;
    }
  }

  private _checkIfPlayerInCrowdBox(playerId: PlayerObject["id"]) {
    const { position } = getPlayerDiscProperties(playerId)!;
    return isInRectangleArea(this._playCrowdBoxArea, position);
  }

  private _addToCrowdBoxIfNotAlready(
    player: PlayerObject,
    time: number
  ): number {
    // If already has a crowd thing, return
    const index = this._playersInCrowdBoxList.findIndex(
      (crowdPlayerData) => crowdPlayerData.playerId === player.id
    );

    if (index !== -1) return index;

    // Ok hes in crowd box, now check if hes alone
    const isAlone =
      this._playersInCrowdBoxList.filter(
        (playerInCrowdBox) =>
          playerInCrowdBox.playerTeam === this._offenseTeamId
      ).length === 0;

    return (
      this._playersInCrowdBoxList.push(
        new PlayerCrowdData(
          player.id,
          player.team as PlayableTeamId,
          time,
          isAlone
        )
      ) - 1
    );
  }

  private _checkIfMeetsCrowdingCriteria(
    index: number,
    timeNow: number
  ): boolean {
    const offensivePlayerInCrowd = this._playersInCrowdBoxList.some(
      (player) => player.playerTeam === this._offenseTeamId
    );

    // Reset everyones time
    if (offensivePlayerInCrowd) {
      this._playersInCrowdBoxList.forEach((player) => {
        player.timeGotInCrowdBox = timeNow;
        player.wasAlone = false;
      });
      return false;
    }

    const crowdingData = this._playersInCrowdBoxList[index];

    const differenceInCrowdingTime = timeNow - crowdingData.timeGotInCrowdBox;

    const crowdingSeconds = crowdingData.wasAlone
      ? this.MAX_CROWD_ABUSE_SECONDS
      : this.MAX_CROWDING_SECONDS;

    const isCrowding =
      differenceInCrowdingTime >= crowdingSeconds &&
      crowdingData.playerTeam !== this._offenseTeamId;

    if (!isCrowding) return false;

    const crowdingPlayerPosition = getPlayerDiscProperties(
      crowdingData.playerId
    )!.position;

    const isTouchingOffensivePlayer = Room.game.players
      .getOffense()
      .some((offensivePlayer) => {
        const { position: offensivePlayerPosition, radius } =
          getPlayerDiscProperties(offensivePlayer.id)!;

        const distanceToCrowdingPlayer = new DistanceCalculator()
          .calcDifference3D(offensivePlayerPosition, crowdingPlayerPosition)
          .calculate();

        return distanceToCrowdingPlayer < radius * 2 + 1;
      });

    if (isTouchingOffensivePlayer) {
      this._playersInCrowdBoxList[index].timeGotInCrowdBox = timeNow;
      this._playersInCrowdBoxList[index].wasAlone = false;
      return false;
    }

    return true;
  }

  private _maybeRemoveFromCrowdBoxList(playerId: PlayerObject["id"]) {
    const index = this._playersInCrowdBoxList.findIndex(
      (player) => player.playerId === playerId
    );

    if (index === -1) return;

    this._playersInCrowdBoxList.splice(index, 1);
  }
}
