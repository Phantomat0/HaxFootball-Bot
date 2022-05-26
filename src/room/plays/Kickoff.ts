import Room from "..";
import BallContact from "../classes/BallContact";
import { PlayerObject, Position } from "../HBClient";
import Ball from "../roomStructures/Ball";
import Chat from "../roomStructures/Chat";
import DistanceCalculator from "../structures/DistanceCalculator";
import MapReferee from "../structures/MapReferee";
import PreSetCalculators from "../structures/PreSetCalculators";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import ICONS from "../utils/Icons";
import { MAP_POINTS } from "../utils/map";
import KickOffEvents from "./play_events/KickOff.events";

export default class KickOff extends KickOffEvents {
  validateBeforePlayBegins(player: PlayerObject | null): never | void {
    // No validations, since this is run by the bot never the player :)
  }

  prepare() {
    const isSafetyKickoff = Room.game.stateExists("safetyKickoff");

    if (isSafetyKickoff) {
      this.setState("safetyKickoff");
    }
    const kickOffPosition = this._determineKickOffPosition();

    this._setStartingPosition(kickOffPosition);
    Ball.setPosition(kickOffPosition);
    this.setBallPositionOnSet(kickOffPosition);
    Room.game.down.setLOS(kickOffPosition.x);
    Room.game.down.moveFieldMarkers({ hideLineToGain: true });
  }

  run(): void {
    // Set a timeout because we need to wait till the ball has been set
    // Otherwise a drag penalty is called
    setTimeout(() => {
      this._setLivePlay(true);
      Ball.release();
    }, 1000);
    this.setState("kickOff");
  }

  cleanUp(): void {}

  handleTouchdown(endPosition: Position): void {
    // If we ever want to add stats for specials teams, would do it here
    super.handleTouchdown(endPosition);
  }

  protected _handleCatch(ballContactObj: BallContact) {
    Chat.send(`${ICONS.Football} Ball Caught`);
    this.setState("kickOffCaught");

    // Adjust the position and set it

    const catchPosition = PreSetCalculators.adjustPlayerPositionFront(
      ballContactObj.playerPosition,
      Room.game.offenseTeamId
    );

    this.setState("catchPosition", catchPosition);
    this._setStartingPosition(catchPosition);

    // Check if caught out of bounds
    const isOutOfBounds = MapReferee.checkIfPlayerOutOfBounds(
      ballContactObj.playerPosition
    );

    const frontPlayerPosition =
      PreSetCalculators.adjustPlayerPositionFrontAfterPlay(
        ballContactObj.playerPosition,
        ballContactObj.player.team
      );

    if (isOutOfBounds) {
      Chat.send(`${ICONS.Pushpin} Caught out of bounds`);
      return this.endPlay({ newLosX: frontPlayerPosition.x, resetDown: true });
    }

    this._setStartingPosition(frontPlayerPosition);
    this.setBallCarrier(ballContactObj.player);
  }

  protected _checkIfOffenseOffsidesOnKick() {
    const losX = Room.game.down.getLOS().x;

    const twoYardsInFrontOfLos = new DistanceCalculator()
      .addByTeam(losX, MAP_POINTS.YARD * 2, Room.game.offenseTeamId)
      .calculate();

    const offensePlayers = Room.game.players.getOffense();

    // Find a player that is offsides

    const offSidePlayer = offensePlayers.find((player) => {
      const { position } = getPlayerDiscProperties(player.id);

      const isOnside = MapReferee.checkIfBehind(
        position.x,
        twoYardsInFrontOfLos,
        Room.game.offenseTeamId
      );

      return isOnside === false;
    });

    const offsidePlayerExists = Boolean(offSidePlayer);

    return {
      isOffsides: offsidePlayerExists,
      offsidesPlayer: offSidePlayer,
    };
  }

  /**
   * The kickoff position is either at the 50, or at the defenive team's 20 in the case of a safety
   */
  protected _determineKickOffPosition(): Position {
    const isKickOffAfterSafety = this.stateExists("safetyKickoff");

    const offenseTwentyYardLine = PreSetCalculators.getPositionOfTeamYard(
      20,
      Room.game.offenseTeamId
    );

    if (isKickOffAfterSafety) return { x: offenseTwentyYardLine, y: 0 };

    // Otherwsie just set it at the 50
    return { x: 0, y: 0 };
  }
}
