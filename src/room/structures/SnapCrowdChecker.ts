import { TEAMS } from "..";
import { PlayableTeamId, PlayerObject } from "../HBClient";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import { MAP_POINTS } from "../utils/map";
import { isInRectangleArea } from "../utils/utils";
import DistanceCalculator from "./DistanceCalculator";

class PlayerCrowdData {
  playerId: PlayerObject["id"];
  timeGotInCrowdBox: number;
  playerTeam: PlayableTeamId;

  constructor(
    playerId: PlayerObject["id"],
    playerTeam: PlayableTeamId,
    timeGotInCrowdBox: number
  ) {
    this.playerId = playerId;
    this.playerTeam = playerTeam;
    this.timeGotInCrowdBox = timeGotInCrowdBox;
  }
}

export default class SnapCrowdChecker {
  private CROWD_BOX_YARDS: number = 5;
  private MAX_CROWDING_SECONDS: number = 3;

  private _playersInCrowdBoxList: PlayerCrowdData[] = [];
  private _offenseTeamId: PlayableTeamId;
  private _playCrowdBoxArea: { x1: number; y1: number; x2: number; y2: number };

  checkPlayersInCrowdBox(players: PlayerObject[], time: number) {
    return players.find((player) => {
      const inCrowd = this._checkIfPlayerInCrowdBox(player.id);
      if (inCrowd) {
        const index = this._maybeAddToCrowdBox(player, time);
        const isCrowding = this._checkIfMeetsCrowdingCriteria(index, time);
        if (isCrowding) return true;
      } else {
        this._maybeRemoveFromCrowdBoxList(player.id);
      }
      return false;
    });
  }

  setOffenseTeam(offenseTeamId: PlayableTeamId) {
    this._offenseTeamId = offenseTeamId;
  }

  setCrowdBoxArea(losX: number) {
    const crowdBoxFront = new DistanceCalculator()
      .addByTeam(
        losX,
        MAP_POINTS.YARD * this.CROWD_BOX_YARDS,
        this._offenseTeamId
      )
      .calculate();

    const twoYardsBehindLos = new DistanceCalculator()
      .subtractByTeam(losX, MAP_POINTS.YARD * 2, this._offenseTeamId)
      .calculate();

    if (this._offenseTeamId === TEAMS.RED) {
      const boxArea = {
        x1: twoYardsBehindLos,
        y1: MAP_POINTS.TOP_HASH,
        x2: crowdBoxFront,
        y2: MAP_POINTS.BOT_HASH,
      };

      this._playCrowdBoxArea = boxArea;
    } else {
      const boxArea = {
        x1: crowdBoxFront,
        y1: MAP_POINTS.TOP_HASH,
        x2: twoYardsBehindLos,
        y2: MAP_POINTS.BOT_HASH,
      };

      this._playCrowdBoxArea = boxArea;
    }
  }

  private _checkIfPlayerInCrowdBox(playerId: PlayerObject["id"]) {
    const { position } = getPlayerDiscProperties(playerId)!;
    return isInRectangleArea(this._playCrowdBoxArea, position);
  }

  private _maybeAddToCrowdBox(player: PlayerObject, time: number) {
    // If already has a crowd thing, return
    const index = this._playersInCrowdBoxList.findIndex(
      (crowdPlayerData) => crowdPlayerData.playerId === player.id
    );

    if (index !== -1) return index;

    return (
      this._playersInCrowdBoxList.push(
        new PlayerCrowdData(player.id, player.team as PlayableTeamId, time)
      ) - 1
    );
  }

  private _checkIfMeetsCrowdingCriteria(index: number, timeNow: number) {
    const offensivePlayerInCrowd = this._playersInCrowdBoxList.some(
      (player) => player.playerTeam === this._offenseTeamId
    );

    if (offensivePlayerInCrowd) {
      this._playersInCrowdBoxList.forEach((player) => {
        player.timeGotInCrowdBox = timeNow;
      });
      return false;
    }

    const crowdingData = this._playersInCrowdBoxList[index];

    const differenceInCrowdingTime = timeNow - crowdingData.timeGotInCrowdBox;
    return (
      differenceInCrowdingTime >= this.MAX_CROWDING_SECONDS &&
      crowdingData.playerTeam !== this._offenseTeamId
    );
  }

  private _maybeRemoveFromCrowdBoxList(playerId: PlayerObject["id"]) {
    const index = this._playersInCrowdBoxList.findIndex(
      (player) => player.playerId === playerId
    );

    if (index === -1) return;

    this._playersInCrowdBoxList.splice(index, 1);
  }
}
