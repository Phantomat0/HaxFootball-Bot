import { PlayableTeamId, PlayerObject, Position } from "../HBClient";
import Chat from "../roomStructures/Chat";
import Ball from "../roomStructures/Ball";
import DistanceCalculator, {
  DistanceConverter,
} from "../structures/DistanceCalculator";
import DownAndDistanceFormatter from "../structures/DownAndDistanceFormatter";
import { DISC_IDS, MAP_POINTS } from "../utils/map";
import { getRandomIntInRange, sleep } from "../utils/utils";
import Punt from "../plays/Punt";
import MapReferee from "../structures/MapReferee";
import { quickPause } from "../utils/haxUtils";
import client from "..";
import Room from "../roomStructures/Room";

export default class Down {
  static CONFIG = {
    DEFAULT_YARDS_TO_GET: 20,
    YARDS_BEHIND_LOS: 2,
  };

  private _los: {
    x: number;
    y: 0;
  } = {
    x: 0,
    y: 0,
  };
  private _mostRecentQb: PlayerObject | null = null;
  private _currentDown: 1 | 2 | 3 | 4 | 5 = 1;
  private _yardsToGet: number = Down.CONFIG.DEFAULT_YARDS_TO_GET;
  private _redZonePenalties: 0 | 1 | 2 | 3 = 0;
  _MAX_REZONE_PENALTIES: number = 3;

  previousDown: {
    down: 1 | 2 | 3 | 4 | 5;
    yardsToGet: number;
    losX: number;
  };
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

  getYardsToGet() {
    return this._yardsToGet;
  }

  setYardsToGet(yards: number) {
    this._yardsToGet = yards;
    return this;
  }

  subtractYardsToGet(netYards: number) {
    this._yardsToGet -= netYards;
    return this;
  }

  getDown() {
    return this._currentDown;
  }

  setDown(down: 1 | 2 | 3 | 4 | 5) {
    this._currentDown = down;
    return this;
  }

  addDown() {
    this._currentDown++;
    return this;
  }

  startNew() {
    this._currentDown = 1;
    this._yardsToGet = Down.CONFIG.DEFAULT_YARDS_TO_GET;
    this._redZonePenalties = 0;
    return;
  }

  setMostRecentQuarterback(player: PlayerObject | null): any {
    if (!player) return (this._mostRecentQb = player);
    this._mostRecentQb = { ...player };
  }

  getSnapPosition() {
    const x = new DistanceCalculator()
      .subtractByTeam(
        this._los.x,
        MAP_POINTS.YARD * Down.CONFIG.YARDS_BEHIND_LOS,
        Room.game.offenseTeamId
      )
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

  getDownAndDistanceString() {
    const down = DownAndDistanceFormatter.formatDown(this._currentDown);

    const lineToGainPoint = this._getLineToGainPoint();

    const yardsOrGoal = DownAndDistanceFormatter.formatYardsToGain(
      lineToGainPoint,
      this._yardsToGet
    );
    const redZonePenalties = DownAndDistanceFormatter.formatRedZonePenalties(
      this._redZonePenalties
    );

    const LOSHalf = DownAndDistanceFormatter.formatPositionToMapHalf(
      this._los.x
    );

    const LOSYard = this.getLOSYard();

    return `${down} & ${yardsOrGoal} at ${LOSHalf}${LOSYard}${redZonePenalties}`;
  }

  sendDownAndDistance() {
    const downAndDistanceStr = this.getDownAndDistanceString();

    Chat.send(downAndDistanceStr, { sound: 0 });
  }

  setTightEndPosition(playerId: PlayerObject["id"], position: Position) {
    client.setPlayerDiscProperties(playerId, position);
    Room.game.moveTightEndDiscs(position);
  }

  setPlayers() {
    const fieldedPlayers = Room.game.players.getFielded();

    function setPlayerPositionRandom(this: Down, player: PlayerObject) {
      const randomYCoordinate = getRandomIntInRange(
        MAP_POINTS.TOP_HASH,
        MAP_POINTS.BOT_HASH
      );

      const twelveYardsBehindLosX = new DistanceCalculator()
        .subtractByTeam(
          this.getLOS().x,
          MAP_POINTS.YARD * 12,
          player.team as PlayableTeamId
        )
        .calculate();

      const playerPositionToSet = {
        x: twelveYardsBehindLosX,
        y: randomYCoordinate,
        xspeed: 0,
        yspeed: 0,
      };

      const isTightEnd = Room.game.checkIfPlayerIsTightEnd(player.id);
      if (isTightEnd)
        return this.setTightEndPosition(player.id, playerPositionToSet);

      client.setPlayerDiscProperties(player.id, playerPositionToSet);
    }

    const getYardsBehindLosX = (player: PlayerObject) => {
      // If they were the most recent QB, spawn them right behind the ball
      if (this._mostRecentQb && this._mostRecentQb.id === player.id) {
        // If there is a mostRecent QB, but on the wrong team, i.e turnover, just reset
        if (this._mostRecentQb.team !== Room.game.offenseTeamId) {
          this.setMostRecentQuarterback(null);
          return 10;
        }

        return 7;
      }

      return 10;
    };

    // Set the position of every fielded player
    fieldedPlayers.forEach((player) => {
      const hasSavedPosition = Room.game.players.playerPositionsMap.has(
        player.id
      );

      // If we dont have a saved position, field him 10 yards behind LOS randomly between one of the hashes
      if (!hasSavedPosition)
        return setPlayerPositionRandom.bind(this, player)();

      // Otherwise set him 7 yards behind LOS, but at the same y coordinate

      const { position } = Room.game.players.playerPositionsMap.get(player.id)!;

      if (this._mostRecentQb) {
        if (this._mostRecentQb.team !== Room.game.offenseTeamId)
          this.setMostRecentQuarterback(null);
      }

      const yardsBehindLosX = getYardsBehindLosX(player);

      const numbYardsBehindLosX = new DistanceCalculator()
        .subtractByTeam(
          this.getLOS().x,
          MAP_POINTS.YARD * yardsBehindLosX,
          player.team as PlayableTeamId
        )
        .calculate();

      const playerPositionToSet = {
        x: numbYardsBehindLosX,
        y: position.y,
        xspeed: 0,
        yspeed: 0,
      };

      const isTightEnd = Room.game.checkIfPlayerIsTightEnd(player.id);
      if (isTightEnd)
        return this.setTightEndPosition(player.id, playerPositionToSet);

      client.setPlayerDiscProperties(player.id, playerPositionToSet);
    });
  }

  setBallAndFieldMarkersPlayEnd() {
    this.moveFieldMarkers();
    const snapPosition = this.getSnapPosition();
    Ball.setPosition(snapPosition);
    Ball.suppress();
    Ball.setProperties({ damping: MAP_POINTS.DEF_DAMPING });
  }

  hardSetPlayers() {
    const fieldedPlayers = Room.game.players.getFielded();

    fieldedPlayers.forEach((player) => {
      const sevenYardsBehindLosX = new DistanceCalculator()
        .subtractByTeam(
          this.getLOS().x,
          MAP_POINTS.YARD * 7,
          player.team as PlayableTeamId
        )
        .calculate();

      const isTightEnd = Room.game.checkIfPlayerIsTightEnd(player.id);
      if (isTightEnd)
        return this.setTightEndPosition(player.id, {
          x: sevenYardsBehindLosX,
          y: 0,
        });

      client.setPlayerDiscProperties(player.id, {
        x: sevenYardsBehindLosX,
        xspeed: 0,
        yspeed: 0,
      });
    });
  }

  hardReset() {
    Room.game.play?.terminatePlayDuringError();
    Room.game.setTightEnd(null);
    this.sendDownAndDistance();
    this.setPlayers();
    // Sets the players too
    Room.game.endPlay();
    this.setBallAndFieldMarkersPlayEnd();
    Room.game.startSnapDelay();
  }

  private async _setPuntIfFourthAndLong() {
    const FOURTH_DOWN = 4;
    // How many yards need to be left for there to be an auto punt
    const MIN_YARDS_FOR_AUTO_PUNT = 15;
    // Dont do auto punt after this time
    const MAX_TIME_FOR_AUTO_PUNT = 60 * 5;
    if (this.getDown() !== FOURTH_DOWN) return;

    // If they are not in their own half, return
    const teamHalf = MapReferee.getMapHalfFromPoint(this._los.x);

    if (teamHalf !== Room.game.offenseTeamId) return;

    if (Room.game.getTimeRounded() > MAX_TIME_FOR_AUTO_PUNT) return;

    if (this.getYardsToGet() < MIN_YARDS_FOR_AUTO_PUNT) return;

    quickPause();

    await sleep(100);

    Chat.send(`⚠️ Automatic punt! 4th & LONG`);

    const offensePlayers = Room.game.players.getOffense();

    const justSetRandomPlayerAsPunter = () => {
      // Just set the punt guy as the first offensive player we can find
      const firstPlayerOnOffense = offensePlayers[0];

      return Room.game.setPlay(
        new Punt(Room.game.getTimeRounded(), firstPlayerOnOffense!),
        firstPlayerOnOffense
      );
    };

    const savedOffensivePlayerPositions = offensePlayers
      .map((player) => {
        const hasSavedPosition = Room.game.players.playerPositionsMap.has(
          player.id
        );

        if (!hasSavedPosition) return null;

        const { position } = Room.game.players.playerPositionsMap.get(
          player.id
        )!;

        return position;
      })
      .filter((el) => el !== null) as Position[];

    // No one on offense had a saved position
    if (savedOffensivePlayerPositions.length === 0)
      return justSetRandomPlayerAsPunter();

    const { index } = MapReferee.getClosestPositionToOtherPosition(
      savedOffensivePlayerPositions,
      this.getSnapPosition()
    );

    if (index === -1) return justSetRandomPlayerAsPunter();

    const closestPlayerToBall = offensePlayers[index];

    Room.game.setPlay(
      new Punt(Room.game.getTimeRounded(), closestPlayerToBall),
      closestPlayerToBall
    );
  }

  setPreviousDownAsCurrentDown() {
    this.previousDown = {
      down: this._currentDown,
      yardsToGet: this._yardsToGet,
      losX: this._los.x,
    };
  }

  async resetAfterDown() {
    this.sendDownAndDistance();
    Room.game.endPlay();
    await sleep(500);
    // Sets the players too
    this.setBallAndFieldMarkersPlayEnd();
    Room.game.startSnapDelay();
    this.setPlayers();
    this._setPuntIfFourthAndLong();
  }

  resetAfterScore() {
    Ball.setProperties({ damping: MAP_POINTS.DEF_DAMPING });
    Room.game.endPlay();
  }

  maybeMovePlayerBehindLosOnField(player: PlayerObject) {
    // Dont set their position if they are mid play
    if (Room.game.play) return;

    const fifteenYardsBehindLosX = new DistanceCalculator()
      .subtractByTeam(
        this.getLOS().x,
        MAP_POINTS.YARD * 15,
        player.team as PlayableTeamId
      )
      .calculate();

    const playerPositionToSet = {
      x: fifteenYardsBehindLosX,
      xspeed: 0,
      yspeed: 0,
    };

    client.setPlayerDiscProperties(player.id, playerPositionToSet);
  }

  private _moveLOSMarkers() {
    client.setDiscProperties(DISC_IDS.LOS_TOP, {
      x: this._los.x,
    });
    client.setDiscProperties(DISC_IDS.LOS_BOT, {
      x: this._los.x,
    });
  }

  private _moveLineToGainMarkers(options: { hideLineToGain?: true } = {}) {
    const lineToGainPoint = this._getLineToGainPoint();

    const maybeHideLineToGain = () => {
      // Hide line to gain if any of the following occurs:
      // 1. Line to gain is in the endzone
      // 2. During a punt or kickoff

      if (options.hideLineToGain) return true;

      // If we reset the play, always show it
      const lineToGainIsAfterEndzone =
        lineToGainPoint <= MAP_POINTS.RED_GOAL_LINE ||
        lineToGainPoint >= MAP_POINTS.BLUE_GOAL_LINE;

      if (lineToGainIsAfterEndzone) return true;

      if (Room.game.play === null) return false;

      return false;
    };

    const lineToGainX = maybeHideLineToGain()
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

  moveFieldMarkers(options: { hideLineToGain?: true } = {}) {
    this._moveLOSMarkers();
    this._moveLineToGainMarkers(options);
    return this;
  }

  private _getLineToGainPoint() {
    return new DistanceCalculator()
      .addByTeam(
        this._los.x,
        MAP_POINTS.YARD * this._yardsToGet,
        Room.game.offenseTeamId
      )
      .calculate();
  }
}
