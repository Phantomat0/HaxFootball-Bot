import BallContact from "../classes/BallContact";
import { PlayerObject, PlayerObjFlat, Position } from "../HBClient";
import Ball from "../roomStructures/Ball";
import Chat from "../roomStructures/Chat";
import Room from "../roomStructures/Room";
import DistanceCalculator from "../structures/DistanceCalculator";
import MapReferee from "../structures/MapReferee";
import PreSetCalculators from "../structures/PreSetCalculators";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import ICONS from "../utils/Icons";
import { MAP_POINTS } from "../utils/map";
import { EndPlayData } from "./BasePlay";
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
    this.resetPlayerPhysicsAndRemoveTightEnd();
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

  /**
   * Extension to our regular endPlay, but in a kickoff we always want to set a new down
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

  checkIfCanOnside(): { canOnside: boolean; reason?: string } {
    const isSafetyKickOff = this.stateExists("safetyKickoff");

    if (isSafetyKickOff)
      return {
        canOnside: false,
        reason: "Cannot perform an onside kick after a safety",
      };

    return {
      canOnside: true,
    };
  }

  protected _handleOffensePenalty(
    player: PlayerObjFlat,
    penaltyName: "offsidesOffense" | "drag" | "ballOutOfBounds"
  ) {
    const offenseFortyYardLine = PreSetCalculators.getPositionOfTeamYard(
      40,
      Room.game.offenseTeamId
    );

    const defenseFortyYardLine = PreSetCalculators.getPositionOfTeamYard(
      40,
      Room.game.defenseTeamId
    );

    // If its a safety, set it as the defense forty, otherwise its the offense forty
    const newLosX = this.stateExists("safetyKickoff")
      ? defenseFortyYardLine
      : offenseFortyYardLine;

    if (penaltyName === "drag") {
      const penaltyType = this.stateExists("safetyKickoff")
        ? "kickOffDragSafety"
        : "kickOffDrag";
      this._handlePenalty(penaltyType, player);
    }

    if (penaltyName === "offsidesOffense") {
      const penaltyType = this.stateExists("safetyKickoff")
        ? "kickOffOffsidesSafety"
        : "kickOffOffsides";
      this._handlePenalty(penaltyType, player);
    }

    if (penaltyName === "ballOutOfBounds") {
      const penaltyType = this.stateExists("safetyKickoff")
        ? "kickOffOutOfBoundsSafety"
        : "kickOffOutOfBounds";
      this._handlePenalty(penaltyType, player);
    }

    this.endPlay({ newLosX: newLosX });
  }

  protected _handleCatch(ballContactObj: BallContact) {
    // Adjust the position and set it
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
      const kicker = this.getState("KickOffKicker");
      Chat.send(`${ICONS.DoNotEnter} Caught out of bounds`);
      return this._handleOffensePenalty(kicker, "ballOutOfBounds");
    }

    Chat.send(`${ICONS.Football} Ball Caught`);
    this.setState("kickOffCaught");

    this.setBallCarrier(ballContactObj.player);
  }

  protected _checkIfOffenseOffsidesOnKick() {
    const losX = Room.game.down.getLOS().x;

    const twoYardsInFrontOfLos = new DistanceCalculator()
      .addByTeam(losX, MAP_POINTS.YARD * 2, Room.game.offenseTeamId)
      .calculate();

    const offensePlayers = Room.game.players.getOffense();

    // Find a player that is offsides

    const offSidePlayer =
      offensePlayers.find((player) => {
        const { position } = getPlayerDiscProperties(player.id)!;

        const isOnside = MapReferee.checkIfBehind(
          position.x,
          twoYardsInFrontOfLos,
          Room.game.offenseTeamId
        );

        return isOnside === false;
      }) ?? null;

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
