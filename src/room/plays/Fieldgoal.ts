import Room, { client } from "..";
import BallContact from "../classes/BallContact";
import PlayerContact from "../classes/PlayerContact";
import { PlayerObject, Position } from "../HBClient";
import Ball from "../roomStructures/Ball";
import Chat from "../roomStructures/Chat";
import DistanceCalculator from "../structures/DistanceCalculator";
import GameReferee from "../structures/GameReferee";
import MapReferee from "../structures/MapReferee";
import { quickPause } from "../utils/haxUtils";
import ICONS from "../utils/Icons";
import { MAP_POINTS } from "../utils/map";
import FieldGoalEvents from "./play_events/FieldGoal.events";

export default class FieldGoal extends FieldGoalEvents {
  private _kicker: PlayerObject;

  constructor(time: number, kicker: PlayerObject) {
    super(time);
    this._kicker = kicker;
    this._ballCarrier = kicker;
  }

  validateBeforePlayBegins() {
    // No real validation
  }

  prepare() {
    Room.game.updateStaticPlayers();
    this._setStartingPosition(Room.game.down.getLOS());
    this.setBallPositionOnSet(Ball.getPosition());
    Room.game.down.moveFieldMarkers();
    this._setPlayersInPosition();
  }

  run() {
    this._setLivePlay(true);
    Ball.release();
    this.setState("fieldGoal");
    Chat.sendMessageMaybeWithClock(
      `${ICONS.PurpleCircle} Field Goal`,
      this.time
    );
    quickPause();
  }

  cleanUp(): void {}

  handleTouchdown(endPosition: Position): void {
    const { netYards } = this._getPlayDataOffense(endPosition);

    // Only way a TD can be scored is if its a rushing TD
    Room.game.stats.updatePlayerStat(this._ballCarrier?.id!, {
      rushingAttempts: 1,
      rushingYards: netYards,
      touchdownsRushed: 1,
    });

    super.handleTouchdown(endPosition);
  }

  handleSuccessfulFg(msg: string) {
    Chat.send(msg);

    Room.game.stats.updatePlayerStat(this._kicker.id, {
      fgAttempts: 1,
      fgMade: 1,
      fgYardsAttempted: Room.game.down.getLOSYard(),
      fgYardsMade: Room.game.down.getLOSYard(),
    });

    this.scorePlay(3, Room.game.offenseTeamId, Room.game.defenseTeamId);
  }

  handleUnsuccessfulFg(msg: string) {
    Chat.send(msg);

    Room.game.stats.updatePlayerStat(this._kicker.id, {
      fgAttempts: 1,
      fgYardsAttempted: Room.game.down.getLOSYard(),
    });

    this.endPlay({});
  }

  protected _getKicker() {
    return this._kicker;
  }

  protected _setKickerInPosition() {
    const sevenYardsBehindBall = new DistanceCalculator()
      .subtractByTeam(
        Room.game.down.getSnapPosition().x,
        MAP_POINTS.YARD * 7,
        Room.game.offenseTeamId
      )
      .calculate();

    client.setPlayerDiscProperties(this._kicker.id, {
      x: sevenYardsBehindBall,
      y: MAP_POINTS.TOP_HASH,
    });

    return this;
  }

  protected _setOffenseInPosition() {
    const offensePlayers = Room.game.players.getOffense();

    const opposingEndzone = MapReferee.getOpposingTeamEndzone(
      Room.game.offenseTeamId
    );

    const fiveYardsBeforeEndzone = new DistanceCalculator()
      .subtractByTeam(
        opposingEndzone,
        MAP_POINTS.YARD * 5,
        Room.game.offenseTeamId
      )
      .calculate();

    offensePlayers.forEach(({ id }) => {
      // Dont set the kicker's position, we already do that
      if (id === this._kicker.id) return;
      client.setPlayerDiscProperties(id, { x: fiveYardsBeforeEndzone });
    });

    return this;
  }

  protected _setDefenseInPosition() {
    const defensePlayers = Room.game.players.getDefense();
    const opposingEndzone = MapReferee.getOpposingTeamEndzone(
      Room.game.offenseTeamId
    );

    const oneYardInFrontOfEndzone = new DistanceCalculator()
      .subtractByTeam(
        opposingEndzone,
        MAP_POINTS.YARD * 1,
        Room.game.defenseTeamId
      )
      .calculate();

    defensePlayers.forEach(({ id }) => {
      client.setPlayerDiscProperties(id, { x: oneYardInFrontOfEndzone });
    });

    return this;
  }

  protected _setPlayersInPosition() {
    this._setKickerInPosition()._setDefenseInPosition()._setOffenseInPosition();
  }

  protected _handleBallContactKicker(ballContactObj: BallContact) {
    if (this.stateExists("fieldGoalKicked"))
      return this.handleUnsuccessfulFg("Illegal fg, touched by kicker");

    if (ballContactObj.type === "touch") return;

    // Now we know its a kick

    // If they try to kick during a run, it counts as a blitz
    if (this.stateExists("ballRan")) return this.setState("fieldGoalBlitzed");

    this.setState("fieldGoalKicked");
  }

  protected _handleRun(playerContactObj: PlayerContact) {
    const { player } = playerContactObj;

    Chat.send(`${ICONS.Running} Ball Ran!`);

    this.setBallCarrier(player).setState("ballRan");
  }

  protected _handleTackle(playerContactObj: PlayerContact) {
    const { endPosition, netYards, yardAndHalfStr } = this._getPlayDataOffense(
      playerContactObj.ballCarrierPosition
    );

    Room.game.stats.updatePlayerStat(playerContactObj.player.id, {
      tackles: 1,
    });

    // Check for sack
    const isSack =
      GameReferee.checkIfSack(
        playerContactObj.ballCarrierPosition,
        Room.game.down.getLOS().x,
        Room.game.offenseTeamId
      ) && this.stateExists("ballRan") === false;

    if (isSack) {
      Chat.send(
        `${ICONS.HandFingersSpread} ${playerContactObj.player.name} with the SACK!`
      );

      Room.game.stats.updatePlayerStat(playerContactObj.player.id, {
        sacks: 1,
      });

      Room.game.stats.updatePlayerStat(playerContactObj.player.id, {
        qbSacks: 1,
      });
    } else {
      Chat.send(`${ICONS.HandFingersSpread} Tackle ${yardAndHalfStr}`);
    }

    // Tackle on a run, or the kicker just goes out of bounds
    if (
      this.stateExists("ballRan") ||
      this._kicker.id === this._ballCarrier!.id
    ) {
      Room.game.stats.updatePlayerStat(this._ballCarrier!.id, {
        rushingAttempts: 1,
        rushingYards: netYards,
      });
    }

    const { isSafety, isTouchback } =
      GameReferee.checkIfSafetyOrTouchbackPlayer(
        this._startingPosition,
        endPosition,
        Room.game.offenseTeamId
      );

    if (isSafety) return this.handleSafety();
    if (isTouchback) return this.handleTouchback();

    this.endPlay({
      newLosX: endPosition.x,
      netYards,
    });
  }

  handleIllegalCrossOffense() {
    return this._handlePenalty("illegalLosCross", this._kicker);
  }

  onBallOutOfHashes() {
    this.handleUnsuccessfulFg("Missed");
  }
}
