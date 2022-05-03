import Room, { client } from "..";
import { Position } from "../HBClient";
import DistanceCalculator from "../structures/DistanceCalculator";
import { DISC_IDS, MAP_POINTS } from "../utils/map";
import WithStateStore from "./WithStateStore";

type DownState = "kickOff" | "punt";

export default class Down extends WithStateStore<DownState> {
  static CONFIG = {
    DEFAULT_YARDS_TO_GET: 20,
  };

  private _los: {
    x: number;
    y: 0;
  } = {
    x: 0,
    y: 0,
  };
  private _currentDown: 1 | 2 | 3 | 4 = 1;
  private _yards: number = Down.CONFIG.DEFAULT_YARDS_TO_GET;

  getLOS() {
    return this._los;
  }

  setLOS(x: Position["x"]) {
    this._los.x = x;
    return this;
  }

  getYards() {
    return this._yards;
  }

  setYards(yards: number) {
    this._yards = yards;
    return this;
  }

  subtractYards(netYards: number) {
    this._yards -= netYards;
    return this;
  }

  getDown() {
    return this._currentDown;
  }

  setDown(down: 1 | 2 | 3 | 4) {
    this._currentDown = down;
    return this;
  }

  addDown() {
    this._currentDown++;
    return this;
  }

  startNew() {
    this._currentDown = 1;
    this._yards = Down.CONFIG.DEFAULT_YARDS_TO_GET;
    this.clearState();
    return;
  }

  getSnapPosition() {
    const x = new DistanceCalculator()
      .subtractByTeam(this._los.x, MAP_POINTS.YARD * 5, Room.game.offenseTeamId)
      .calculate();

    return {
      x,
      y: 0,
    };
  }

  sendDownAndDistance() {}

  setPlayers() {}

  setBallAndFieldMarkersPlayEnd() {}

  resetAfterDown() {
    this.sendDownAndDistance();
    this.setPlayers();
    // Sets the players too
    Room.game.endPlay();
    this.setBallAndFieldMarkersPlayEnd();
  }

  private _moveLOSMarkers() {
    client.setDiscProperties(DISC_IDS.LOS_TOP, {
      x: this._los.x,
    });
    client.setDiscProperties(DISC_IDS.LOS_BOT, {
      x: this._los.x,
    });
  }

  private _moveLineToGainMarkers() {
    const lineToGainPoint = new DistanceCalculator()
      .addByTeam(
        this._los.x,
        MAP_POINTS.YARD * this._yards,
        Room.game.offenseTeamId
      )
      .calculate();

    const maybehideLineToGain = () => {
      // Hide line to gain if any of the following occurs:
      // 1. Line to gain is in the endzone
      // 2. During a punt or kickoff

      // If we reset the play, always show it
      if (Room.game.play === null) return false;
      const lineToGainIsAfterEndzone =
        lineToGainPoint <= MAP_POINTS.RED_ENDZONE ||
        lineToGainPoint >= MAP_POINTS.BLUE_ENDZONE;

      if (lineToGainIsAfterEndzone) return true;
      return (
        Room.game.down.getState("kickOff") || Room.game.down.getState("punt")
      );
    };

    const lineToGainX = maybehideLineToGain()
      ? MAP_POINTS.HIDDEN
      : lineToGainPoint;

    client.setDiscProperties(DISC_IDS.LTG_TOP, {
      x: lineToGainX,
      y: MAP_POINTS.TOP_SIDELINE,
    });
    client.setDiscProperties(DISC_IDS.LTG_BOT, {
      x: lineToGainX,
      y: MAP_POINTS.BOT_SIDELINE,
    });
  }

  moveFieldMarkers() {
    this._moveLOSMarkers();
    this._moveLineToGainMarkers();
    return this;
  }
}
