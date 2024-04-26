import client from "..";
import BallContact from "../classes/BallContact";
import PlayerContact from "../classes/PlayerContact";
import { GameCommandError } from "../commands/GameCommandHandler";
import { PlayerObject, Position } from "../HBClient";
import Ball from "../roomStructures/Ball";
import Chat from "../roomStructures/Chat";
import Room from "../roomStructures/Room";
import DistanceCalculator from "../structures/DistanceCalculator";
import GameReferee from "../structures/GameReferee";
import MapReferee from "../structures/MapReferee";
import PreSetCalculators from "../structures/PreSetCalculators";
import { quickPause } from "../utils/haxUtils";
import ICONS from "../utils/Icons";
import { MAP_POINTS } from "../utils/map";
import FieldGoalEvents from "./play_events/FieldGoal.events";

export default class FieldGoal extends FieldGoalEvents {
  protected _kicker: PlayerObject;

  constructor(time: number, kicker: PlayerObject) {
    super(time);
    this._kicker = kicker;
    this._ballCarrier = kicker;
  }

  validateBeforePlayBegins() {
    // If they are behind their own twentyYardLine, invalid FG
    const offenseTwentyYardLine = PreSetCalculators.getPositionOfTeamYard(
      20,
      Room.game.offenseTeamId
    );

    const isBehindTwentyYardLine = MapReferee.checkIfBehind(
      Room.game.down.getLOS().x,
      offenseTwentyYardLine,
      Room.game.offenseTeamId
    );

    if (isBehindTwentyYardLine)
      throw new GameCommandError(
        "You are too far away to attempt a field goal",
        true
      );
  }

  prepare() {
    this.resetPlayerPhysicsAndRemoveTightEnd();
    Room.game.updateStaticPlayers();
    this._setStartingPosition(Room.game.down.getLOS());

    const topOrBottomHashCoordinate = this._determineTopOrBottomHashStartPos();

    const ballStartingPos = this._setBallInPosition(topOrBottomHashCoordinate);
    this.setBallPositionOnSet(ballStartingPos);

    Room.game.down.moveFieldMarkers();
    this._setPlayersInPosition(topOrBottomHashCoordinate);
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

  handleSuccessfulFg() {
    Chat.send(`${ICONS.GreenCheck} Field Goal is good!`, { sound: 2 });

    Room.game.stats.updatePlayerStat(this._kicker.id, {
      fgAttempts: 1,
      fgMade: 1,
      fgYardsAttempted: Room.game.down.getLOSYard(),
      fgYardsMade: Room.game.down.getLOSYard(),
    });

    this.scorePlay(3, Room.game.offenseTeamId, Room.game.defenseTeamId);
  }

  handleUnsuccessfulFg() {
    Chat.send(`${ICONS.X} Field Goal is no good!`);

    Room.game.stats.updatePlayerStat(this._kicker.id, {
      fgAttempts: 1,
      fgYardsAttempted: Room.game.down.getLOSYard(),
    });

    this.endPlay({});
  }

  handleDefenseLineBlitz() {
    this.setState("fieldGoalLineBlitzed");
    if (this._ballCarrier)
      client.setPlayerAvatar(this._ballCarrier.id, ICONS.Football);
  }

  handleIllegalCrossOffense() {
    return this._handlePenalty("illegalLosCross", this._kicker);
  }

  protected _getKicker() {
    return this._kicker;
  }

  handleQuarterbackLOSCross(
    qbOrKicker: ReturnType<InstanceType<typeof FieldGoal>["getBallCarrier"]>
  ) {
    return this._handlePenalty("illegalLosCross", this._kicker);
  }

  protected _setBallInPosition(topOrBotHashYCoordinate: Position["y"]) {
    const positionToSet = {
      y: topOrBotHashYCoordinate,
      x: Room.game.down.getSnapPosition().x,
    };
    Ball.setPosition(positionToSet);

    return positionToSet;
  }

  protected _setKickerInPosition(topOrBottomHashCoordinate: number) {
    const sevenYardsBehindBall = new DistanceCalculator()
      .subtractByTeam(
        Room.game.down.getSnapPosition().x,
        MAP_POINTS.YARD * 7,
        Room.game.offenseTeamId
      )
      .calculate();

    const sixYardsAwayFromHash =
      topOrBottomHashCoordinate < 0
        ? topOrBottomHashCoordinate - MAP_POINTS.YARD * 6
        : topOrBottomHashCoordinate + MAP_POINTS.YARD * 6;

    client.setPlayerDiscProperties(this._kicker.id, {
      x: sevenYardsBehindBall,
      y: sixYardsAwayFromHash,
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

  protected _setPlayersInPosition(topOrBottomHashCoordinate: number) {
    this._setKickerInPosition(topOrBottomHashCoordinate)
      ._setDefenseInPosition()
      ._setOffenseInPosition();
  }

  protected _handleBallContactKicker(ballContactObj: BallContact) {
    if (ballContactObj.type === "touch") return;

    // Now we know its a kick

    // If they try to kick during a run, it counts as a blitz
    if (this.stateExists("ballRan")) return this.setState("fieldGoalBlitzed");

    this.setState("fieldGoalKicked");

    // Set ball carrier to null to remove emoji
    this.setBallCarrier(null);

    Ball.makeImmovableButKeepSpeed();
  }

  protected _handleRun(playerContactObj: PlayerContact) {
    const { player } = playerContactObj;

    Chat.send(`${ICONS.Running} Ball Ran!`);

    this.setBallCarrier(player).setState("ballRan");
  }

  protected _handleRunTackle(playerContactObj: PlayerContact): void {
    // First tackle
    const isFirstTackle = this.stateExists("runFirstTackler") === false;

    if (isFirstTackle) {
      this.setState("runFirstTackler", playerContactObj.player);
      Chat.send("First tackle");

      setTimeout(() => {
        this.setState("canSecondTackle");
      }, 500);
      return;
    }
    // Second Tackle
    const isSamePlayedWhoInitiallyTackled =
      this.getState("runFirstTackler").id === playerContactObj.player.id;

    if (
      this.stateExists("canSecondTackle") === false &&
      isSamePlayedWhoInitiallyTackled
    )
      return;

    // Handle second tackle
    return this._handleTackle(playerContactObj);
  }

  private _handleRunTackleStats(playerContactObj: PlayerContact) {
    const { netYards } = this._getPlayDataOffense(
      playerContactObj.ballCarrierPosition
    );

    // Update Tackles
    Room.game.stats.updatePlayerStat(playerContactObj.player.id, {
      tackles: 0.5,
    });

    const firstTackler = this.getState("runFirstTackler");

    Room.game.stats.updatePlayerStat(firstTackler.id, {
      tackles: 0.5,
    });

    // Update rushing stats
    Room.game.stats.updatePlayerStat(this._ballCarrier!.id, {
      rushingAttempts: 1,
      rushingYards: netYards,
    });
  }

  protected _handleTackle(playerContactObj: PlayerContact) {
    const { endPosition, netYards, yardAndHalfStr } = this._getPlayDataOffense(
      playerContactObj.ballCarrierPosition
    );

    // Check for sack
    const isSack =
      GameReferee.checkIfSack(
        playerContactObj.ballCarrierPosition,
        Room.game.down.getLOS().x,
        Room.game.offenseTeamId
      ) && this.stateExists("ballRan") === false;

    if (isSack) {
      Chat.send(
        `${
          ICONS.HandFingersSpread
        } ${playerContactObj.player.name.trim()} with the SACK!`
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

    // Tackles on runs are dealt differently, since there can be half tackles
    if (this.stateExists("ballRan")) {
      this._handleRunTackleStats(playerContactObj);
    } else {
      Room.game.stats.updatePlayerStat(playerContactObj.player.id, {
        tackles: 1,
      });
    }

    // Tackle on a kicker run
    if (this._ballCarrier!.id === this._kicker.id) {
      Room.game.stats.updatePlayerStat(this._ballCarrier!.id, {
        rushingAttempts: 1,
        rushingYards: netYards,
      });
    }

    const { isSafety } = GameReferee.checkIfSafetyOrTouchbackPlayer(
      this._startingPosition,
      endPosition,
      Room.game.offenseTeamId
    );

    if (isSafety) return this._handleSafety();

    this.endPlay({
      newLosX: endPosition.x,
      netYards,
    });
  }

  private _determineTopOrBottomHashStartPos() {
    const lastPlayEndPosition = Room.game.lastPlayEndPosition;

    if (lastPlayEndPosition.y <= 0) return MAP_POINTS.TOP_HASH;
    return MAP_POINTS.BOT_HASH;
  }
}
