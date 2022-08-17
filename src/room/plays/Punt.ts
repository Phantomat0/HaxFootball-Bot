import client from "..";
import BallContact from "../classes/BallContact";
import {
  PlayableTeamId,
  PlayerObject,
  PlayerObjFlat,
  Position,
} from "../HBClient";
import Ball from "../roomStructures/Ball";
import Chat from "../roomStructures/Chat";
import Room from "../roomStructures/Room";
import DistanceCalculator, {
  DistanceConverter,
} from "../structures/DistanceCalculator";
import MapReferee from "../structures/MapReferee";
import MessageFormatter from "../structures/MessageFormatter";
import PreSetCalculators from "../structures/PreSetCalculators";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import ICONS from "../utils/Icons";
import { MAP_POINTS } from "../utils/map";
import { TEAMS } from "../utils/types";
import { EndPlayData } from "./BasePlay";
import PuntEvents from "./play_events/Punt.events";

export default class Punt extends PuntEvents {
  /**
   * Not the kicker, just so we can set him infront of the ball
   */
  private _playerWhoCalledPunt: PlayerObject;

  constructor(time: number, player: PlayerObject) {
    super(time);
    this._playerWhoCalledPunt = player;
  }

  validateBeforePlayBegins() {}

  prepare() {
    this.setState("punt");
    Room.game.updateStaticPlayers();
    this._setStartingPosition(Room.game.down.getLOS());
    this.setBallPositionOnSet(Ball.getPosition());
    Room.game.down.moveFieldMarkers();
    this._setPlayersInPosition();
    this._createInvisibleWallForDefense();
    this.resetPlayerPhysicsAndRemoveTightEnd();
  }

  run() {
    Chat.send(`${ICONS.OrangeCircle} Punt Called!`);
    this._setLivePlay(true);
    Ball.release();
  }

  cleanUp(): void {
    // Sometimes this wont be called when the ball hasn't been kicked such as a drag punt kick
    this._releaseInvisibleWallForDefense();
  }

  /**
   * Extension to our regular endPlay, but in a kickoff we always want to set a new down, unless its a penalty
   */
  protected _endPlayAndSetNewDown(
    endPlayData: Omit<EndPlayData, "setNewDown">
  ) {
    super.endPlay({ ...endPlayData, setNewDown: true });
  }

  handleTouchdown(endPosition: Position): void {
    const { netYards } = this._getPlayDataOffense(endPosition);

    Room.game.stats.updatePlayerStat(this._ballCarrier!.id, {
      specReceptions: 1,
      specReceivingYards: netYards,
      specTouchdowns: 1,
    });

    super.handleTouchdown(endPosition);
  }

  protected _handleCatch(ballContactObj: BallContact) {
    const { player, playerPosition } = ballContactObj;
    const { team } = player;

    const adjustedCatchPosition = PreSetCalculators.adjustRawEndPosition(
      playerPosition,
      team as PlayableTeamId
    );

    this.setState("puntCaught");
    this._setStartingPosition(adjustedCatchPosition);

    // Check if caught out of bounds
    const isOutOfBounds = MapReferee.checkIfPlayerOutOfBounds(
      ballContactObj.playerPosition
    );

    const ballPositionYardLine = DistanceConverter.toYardLine(
      adjustedCatchPosition.x
    );

    const ballPositionYardLineStr = MessageFormatter.formatYardAndHalfStr(
      ballPositionYardLine,
      adjustedCatchPosition.x
    );

    if (isOutOfBounds) {
      Chat.send(
        `${ICONS.DoNotEnter} Caught out of bounds ${ballPositionYardLineStr}`
      );
      return this._endPlayAndSetNewDown({ newLosX: adjustedCatchPosition.x });
    }

    Chat.send(`${ICONS.Football} Ball Caught`);

    this.setBallCarrier(player);
  }

  protected _getFromYardAndHalfStr() {
    const fromYard = DistanceConverter.toYardLine(this._ballPositionOnSet!.x);

    return MessageFormatter.formatYardAndHalfStr(
      fromYard,
      this._ballPositionOnSet!.x
    );
  }

  protected _checkIfOffenseOffsidesOnKick(playerWhoKicked: PlayerObjFlat): {
    isOffsides: boolean;
    offsidesPlayer: PlayerObject | null;
  } {
    // We give some leniancy, 2 yards infront of the LOS
    const team = Room.game.defenseTeamId;

    const twoYardsInFrontOfLOS = new DistanceCalculator()
      .addByTeam(Room.game.down.getLOS().x, MAP_POINTS.YARD * 2, team)
      .calculate();

    // The "offense" is actually now the defense, switch we switched teams
    const offensePlayers = Room.game.players.getDefense();

    const offsidesPlayer =
      offensePlayers.find((player) => {
        // Filter out the kicker
        if (player.id === playerWhoKicked.id) return false;
        const { position } = getPlayerDiscProperties(player.id)!;

        const isOnside = MapReferee.checkIfBehind(
          position.x,
          twoYardsInFrontOfLOS,
          team
        );

        return isOnside === false;
      }) ?? null;

    return {
      isOffsides: Boolean(offsidesPlayer),
      offsidesPlayer,
    };
  }

  protected _handleOffensePenalty(
    player: PlayerObjFlat,
    penaltyName: "puntOffsidesOffense" | "puntDrag"
  ) {
    // We swap offense since the swap happens on the kick, and we haven't kicked it yet
    if (this.stateExists("puntKicked")) {
      Room.game.swapOffenseAndUpdatePlayers();
    }

    this._handlePenalty(penaltyName, player);

    //

    // const offenseFortyYardLine = PreSetCalculators.getPositionOfTeamYard(
    //   40,
    //   Room.game.offenseTeamId
    // );

    // this.endPlay({ newLosX: offenseFortyYardLine });
  }

  private _setPlayerWhoCalledPuntInPosition() {
    const tenYardsBehindBall = new DistanceCalculator()
      .subtractByTeam(
        Room.game.down.getSnapPosition().x,
        MAP_POINTS.YARD * 10,
        Room.game.offenseTeamId
      )
      .calculate();

    client.setPlayerDiscProperties(this._playerWhoCalledPunt.id, {
      x: tenYardsBehindBall,
      y: 0,
    });

    return this;
  }

  private _setPlayersInPosition() {
    this._setPlayerWhoCalledPuntInPosition()
      ._setOffenseInPosition()
      ._setDefenseInPosition();
  }

  private _setOffenseInPosition() {
    // Filter out the kicker
    const offensePlayersNoKicker = Room.game.players
      .getOffense()
      .filter((player) => player.id !== this._playerWhoCalledPunt.id);

    const fifteenYardsBehindBall = new DistanceCalculator()
      .subtractByTeam(
        Room.game.down.getSnapPosition().x,
        MAP_POINTS.YARD * 15,
        Room.game.offenseTeamId
      )
      .calculate();

    offensePlayersNoKicker.forEach((player) => {
      client.setPlayerDiscProperties(player.id, { x: fifteenYardsBehindBall });
    });
    return this;
  }

  private _setDefenseInPosition() {
    const defensePlayers = Room.game.players.getDefense();
    const defenseEndzone = MapReferee.getTeamEndzone(Room.game.defenseTeamId);
    const twoYardsInFrontOfEndzone = new DistanceCalculator()
      .subtractByTeam(
        defenseEndzone,
        MAP_POINTS.YARD * 2,
        Room.game.defenseTeamId
      )
      .calculate();

    defensePlayers.forEach((player) => {
      client.setPlayerDiscProperties(player.id, {
        x: twoYardsInFrontOfEndzone,
      });
    });
    return this;
  }

  private _createInvisibleWallForDefense() {
    const defensePlayers = Room.game.players.getDefense();
    defensePlayers.forEach((player) => {
      const cf = client.CollisionFlags;
      const cfTeam = Room.game.defenseTeamId === TEAMS.RED ? cf.red : cf.blue;
      client.setPlayerDiscProperties(player.id, { cGroup: cfTeam | cf.c0 });
    });
    return this;
  }

  protected _releaseInvisibleWallForDefense() {
    const defensePlayers = Room.game.players.getDefense();
    defensePlayers.forEach((player) => {
      const cf = client.CollisionFlags;
      const cfTeam = Room.game.defenseTeamId === TEAMS.RED ? cf.red : cf.blue;
      client.setPlayerDiscProperties(player.id, { cGroup: cfTeam });
    });
    return this;
  }
}
