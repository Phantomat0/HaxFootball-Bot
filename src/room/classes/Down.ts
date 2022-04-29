import { client } from "..";
import { Position } from "../HBClient";
import { DISC_IDS, MAP_POINTS } from "../utils/map";
import WithStateStore from "./WithStateStore";

type DownState = "lmao";

export default class Down extends WithStateStore<DownState> {
  static CONFIG = {
    DEFAULT_YARDS_TO_GET: 20,
  };

  private _los: {
    x: number;
  } = {
    x: 0,
  };
  private _currentDown: 1 | 2 | 3 | 4 = 1;
  private _yards: number = Down.CONFIG.DEFAULT_YARDS_TO_GET;

  getLOS() {
    return this._los.x;
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

  getSnapDistance() {
    return new DistanceCalculator([this._los.x, MAP.YARD * 5])
      .subtractByTeam(game.getOffenseTeam())
      .getDistance();
  }

  moveFieldMarkers() {
    const lineToGain = new DistanceCalculator([
      this._los.x,
      MAP_POINTS.YARD * this._yards,
    ])
      .addByTeam(game.getOffenseTeam())
      .getDistance();

    const maybehideLineToGain = () => {
      const lineToGainIsAfterEndzone =
        lineToGain <= MAP_POINTS.RED_ENDZONE ||
        lineToGain >= MAP_POINTS.BLUE_ENDZONE;

      if (lineToGainIsAfterEndzone) return true;
      if (play === null) return false;
      return play.getState("kickOff") || play.getState("punt");
    };

    console.log(maybehideLineToGain());

    const lineToGainX = maybehideLineToGain() ? MAP_POINTS.HIDDEN : lineToGain;

    client.setDiscProperties(DISC_IDS.LOS_TOP, {
      x: this._los.x,
    });
    client.setDiscProperties(DISC_IDS.LOS_BOT, {
      x: this._los.x,
    });

    client.setDiscProperties(DISC_IDS.LTG_TOP, {
      x: lineToGainX,
      y: MAP_POINTS.TOP_SIDELINE,
    });
    client.setDiscProperties(DISC_IDS.LTG_BOT, {
      x: lineToGainX,
      y: MAP_POINTS.BOT_SIDELINE,
    });

    return this;
  }
}
