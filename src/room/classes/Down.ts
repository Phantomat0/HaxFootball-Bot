import Room, { client } from "..";
import { Position } from "../HBClient";
import Chat from "../roomStructures/Chat";
import Ball from "../structures/Ball";
import DistanceCalculator, {
  DistanceConverter,
} from "../structures/DistanceCalculator";
import DownAndDistanceFormatter from "../structures/DownAndDistanceFormatter";
import { DISC_IDS, MAP_POINTS } from "../utils/map";
import WithStateStore from "./WithStateStore";

interface DownStore {
  kickOff: true;
  punt: true;
}

export default class Down extends WithStateStore<DownStore, keyof DownStore> {
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
  private _currentDown: 1 | 2 | 3 | 4 | 5 = 1;
  private _yards: number = Down.CONFIG.DEFAULT_YARDS_TO_GET;
  private _redZonePenalties: 0 | 1 | 2 | 3 = 0;
  _MAX_REZONE_PENALTIES: number = 3;

  getLOS() {
    return this._los;
  }

  setLOS(x: Position["x"]) {
    this._los.x = x;
    return this;
  }

  getLOSYard() {
    return DistanceConverter.toYardLine(this._los.x);
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

  incrementRedZonePenalties() {
    this._redZonePenalties++;
  }

  hasReachedMaxRedzonePenalties() {
    return this._redZonePenalties === this._MAX_REZONE_PENALTIES;
  }

  sendDownAndDistance() {
    const down = DownAndDistanceFormatter.formatDown(this._currentDown);
    const yardsOrGoal = DownAndDistanceFormatter.formatYardsToGain(
      this._los.x,
      this._yards
    );
    const redZonePenalties = DownAndDistanceFormatter.formatRedZonePenalties(
      this._redZonePenalties
    );

    const LOSHalf = DownAndDistanceFormatter.formatPositionToMapHalf(
      this._los.x
    );

    const LOSYard = this.getLOSYard();

    const formattedMessage = `${down} & ${yardsOrGoal} at ${LOSHalf}${LOSYard}${redZonePenalties}`;

    Chat.send(formattedMessage);
  }

  setPlayers() {
    const offensePlayers = Room.game.players.getOffense();
    const defensePlayers = Room.game.players.getDefense();

    // Set the players 7 yards behind the LOS
    const offensePositionXSet = new DistanceCalculator()
      .subtractByTeam(this._los.x, MAP_POINTS.YARD * 7, Room.game.offenseTeamId)
      .calculate();

    const defensePositionXSet = new DistanceCalculator()
      .subtractByTeam(this._los.x, MAP_POINTS.YARD * 7, Room.game.defenseTeamId)
      .calculate();

    offensePlayers.forEach((player) => {
      client.setPlayerDiscProperties(player.id, {
        x: offensePositionXSet,
      });
    });

    defensePlayers.forEach((player) => {
      client.setPlayerDiscProperties(player.id, {
        x: defensePositionXSet,
      });
    });
  }

  setBallAndFieldMarkersPlayEnd() {
    this.moveFieldMarkers();
    const snapPosition = this.getSnapPosition();
    Ball.setPosition(snapPosition);
    Ball.suppress();
  }

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
