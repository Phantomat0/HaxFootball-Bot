import Room, { client } from "..";
import BallContact from "../classes/BallContact";
import { PlayerObject, Position } from "../HBClient";
import Ball from "../roomStructures/Ball";
import Chat from "../roomStructures/Chat";
import DistanceCalculator from "../structures/DistanceCalculator";
import MapReferee from "../structures/MapReferee";
import PreSetCalculators from "../structures/PreSetCalculators";
import { quickPause } from "../utils/haxUtils";
import ICONS from "../utils/Icons";
import { MAP_POINTS } from "../utils/map";
import { EndPlayData } from "./BasePlay";
import OnsideKickEvents from "./play_events/OnsideKick.events";

export default class OnsideKick extends OnsideKickEvents {
  protected _kicker: PlayerObject;

  constructor(time: number, kicker: PlayerObject) {
    super(time);
    this._kicker = kicker;
    this._ballCarrier = kicker;
  }

  validateBeforePlayBegins(player: PlayerObject | null): void {}

  prepare(): void {
    // Set the LOS at the offense 5 yard line
    const offenseFiveYardLine = PreSetCalculators.getPositionOfTeamYard(
      5,
      Room.game.offenseTeamId
    );

    const kickOffPosition = { x: offenseFiveYardLine, y: 0 };

    this._setStartingPosition(kickOffPosition);
    Ball.setPosition(kickOffPosition);
    this.setBallPositionOnSet(kickOffPosition);
    Room.game.down.setLOS(kickOffPosition.x);
    Room.game.down.moveFieldMarkers({ hideLineToGain: true });

    this._setPlayersInPosition();

    // Give the kicker a onsideKickAttempted
    Room.game.stats.updatePlayerStat(this._kicker.id, {
      onsideKicksAttempted: 1,
    });
  }

  run(): void {
    this._setLivePlay(true);
    Ball.release();
    this.setState("onsideKick");
    Chat.sendMessageMaybeWithClock(
      `${ICONS.WhiteCircle} Onside Kick Attempt`,
      this.time
    );
    quickPause();
  }

  cleanUp(): void {}

  /**
   * Extension to our regular endPlay, but in a onside kick we always want to set a new down
   */
  endPlay(endPlayData: Omit<EndPlayData, "setNewDown">) {
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
    const adjustedCatchPosition = PreSetCalculators.adjustRawEndPosition(
      ballContactObj.playerPosition,
      Room.game.offenseTeamId
    );

    this._setStartingPosition(adjustedCatchPosition);

    // Check if caught out of bounds
    const isOutOfBounds = MapReferee.checkIfPlayerOutOfBounds(
      ballContactObj.playerPosition
    );

    if (isOutOfBounds) {
      Chat.send(`${ICONS.DoNotEnter} Caught out of bounds`);
      return this._handleUnsuccessfulOnsideKick("Kicked out of bounds");
    }

    Chat.send(`${ICONS.Football} Ball Caught`);
    this.setState("onsideKickCaught");

    this.setBallCarrier(ballContactObj.player);
  }

  protected _handleUnsuccessfulOnsideKick(msg: string | null) {
    // If theres a message for the reason for the invalid offside kick, send it
    if (msg) {
      Chat.send(`Unsuccessful onside kick - ${msg}`);
    }

    if (this.stateExists("onsideKickKicked") === false) {
      Room.game.swapOffenseAndUpdatePlayers();
    }

    const defenseFortyYardLine = PreSetCalculators.getPositionOfTeamYard(
      40,
      Room.game.defenseTeamId
    );

    this.endPlay({ newLosX: defenseFortyYardLine });
  }

  protected _handleSuccessfulOnsideKick(ballContactObj: BallContact) {
    Chat.send(`${ICONS.Fire} Onside Kick recovered!`, { sound: 2 });

    // Add the stat here
    Room.game.stats.updatePlayerStat(this._kicker.id, {
      onsideKicksConverted: 1,
    });

    Room.game.swapOffenseAndUpdatePlayers();

    // Ball is placed at the offense twenty yard line
    const offenseTwentyYardLine = PreSetCalculators.getPositionOfTeamYard(
      20,
      Room.game.offenseTeamId
    );

    this.endPlay({ newLosX: offenseTwentyYardLine });
  }

  protected _handleBallContactKicker(ballContactObj: BallContact) {
    if (this.stateExists("onsideKickKicked") === false) {
      if (ballContactObj.type === "touch") return;
      // We know its a kick
      Room.game.swapOffenseAndUpdatePlayers();
      return this.setState("onsideKickKicked");
    }

    // The kicker touches after he has kicked off

    const ballPosition = Ball.getPosition();
    // Check that the position is after the 0, we use defensive position since offense switches on the kick
    const isAfterHalfway = MapReferee.checkIfInFront(
      ballPosition.x,
      0,
      Room.game.defenseTeamId
    );

    if (isAfterHalfway) return this._handleSuccessfulOnsideKick(ballContactObj);

    // If hes not after half way, adjust the ball for the offense and end the play there
    Chat.send("Onside kick illegally recovered in own half");

    const adjustedBallPositionForTeam =
      PreSetCalculators.adjustBallPositionOnOutOfBounds(
        ballPosition,
        Room.game.offenseTeamId
      );

    this.endPlay({ newLosX: adjustedBallPositionForTeam.x });
  }

  private _setPlayersInPosition() {
    this._setKickerInPosition()._setOffenseInPosition();
  }

  private _setKickerInPosition() {
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

  private _setDefenseInPosition() {
    // const defensePlayers = Room.game.players.getDefense();
    // const opposingEndzone = MapReferee.getOpposingTeamEndzone(
    //   Room.game.offenseTeamId
    // );
    // const oneYardInFrontOfEndzone = new DistanceCalculator()
    //   .subtractByTeam(
    //     opposingEndzone,
    //     MAP_POINTS.YARD * 1,
    //     Room.game.defenseTeamId
    //   )
    //   .calculate();
    // defensePlayers.forEach(({ id }) => {
    //   client.setPlayerDiscProperties(id, { x: oneYardInFrontOfEndzone });
    // });
    // return this;
  }

  private _setOffenseInPosition() {
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
}
