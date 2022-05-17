import Room, { client } from "..";
import { PlayableTeamId, PlayerObject, Position } from "../HBClient";
import Chat from "../roomStructures/Chat";
import Ball from "../structures/Ball";
import DistanceCalculator, {
  DistanceConverter,
} from "../structures/DistanceCalculator";
import DownAndDistanceFormatter from "../structures/DownAndDistanceFormatter";
import { DISC_IDS, MAP_POINTS } from "../utils/map";
import { getRandomIntInRange } from "../utils/utils";
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
    const fieldedPlayers = Room.game.players.getFielded();

    function setPlayerPositionRandom(this: Down, player: PlayerObject) {
      const randomYCoordinate = getRandomIntInRange(
        MAP_POINTS.TOP_HASH,
        MAP_POINTS.BOT_HASH
      );

      const tenYardsBehindLosX = new DistanceCalculator()
        .subtractByTeam(
          this.getLOS().x,
          MAP_POINTS.YARD * 10,
          player.team as PlayableTeamId
        )
        .calculate();

      const playerPositionToSet = {
        x: tenYardsBehindLosX,
        y: randomYCoordinate,
      };

      client.setPlayerDiscProperties(player.id, playerPositionToSet);
    }

    // Set the position of every fielded player
    fieldedPlayers.forEach((player) => {
      const hasSavedPosition = Room.game.players.playerPositionsMap.has(
        player.id
      );

      // If we dont have a saved position, field him 10 yards behin LOS randomly between one of the hashes
      if (!hasSavedPosition)
        return setPlayerPositionRandom.bind(this, player)();

      // Otherwise set him 7 yards behind LOS, but at the same y coordinate

      const { position, team } = Room.game.players.playerPositionsMap.get(
        player.id
      )!;

      const sevenYardsBehindLosX = new DistanceCalculator()
        .subtractByTeam(
          this.getLOS().x,
          MAP_POINTS.YARD * 7,
          team as PlayableTeamId
        )
        .calculate();

      const playerPositionToSet = {
        x: sevenYardsBehindLosX,
        y: position.y,
      };

      client.setPlayerDiscProperties(player.id, playerPositionToSet);
    });
  }

  setBallAndFieldMarkersPlayEnd() {
    this.moveFieldMarkers();
    const snapPosition = this.getSnapPosition();
    Ball.setPosition(snapPosition);
    Ball.suppress();
  }

  hardReset() {
    Room.game.play?.terminatePlayDuringError();
    this.sendDownAndDistance();
    this.setPlayers();
    // Sets the players too
    Room.game.endPlay();
    this.setBallAndFieldMarkersPlayEnd();
    Room.game.startSnapDelay();
  }

  resetAfterDown() {
    this.sendDownAndDistance();
    this.setPlayers();
    // Sets the players too
    Room.game.endPlay();
    this.setBallAndFieldMarkersPlayEnd();
    Room.game.startSnapDelay();
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
