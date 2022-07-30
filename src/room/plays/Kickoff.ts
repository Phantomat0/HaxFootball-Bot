import BallContact from "../classes/BallContact";
import { PlayerObject, PlayerObjFlat, Position } from "../HBClient";
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

    this._initializePlayData("Kickoff");
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

    this._playData.setScoreType(
      "Touchdown",
      `$SCORER1$ ${netYards} Yd Return`,
      {
        scorer1: this._ballCarrier!.id,
      }
    );

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

  protected _handleBallOutOfBounds(ballPosition: Position) {
    const adjustedBallPositionForTeam =
      PreSetCalculators.adjustBallPositionOnOutOfBounds(
        ballPosition,
        Room.game.offenseTeamId
      );
    const kicker = this.getState("KickOffKicker");

    // If its not a safety, its a penalty
    if (this.stateExists("safetyKickoff") === false)
      return this._handleOffensePenalty(kicker, "ballOutOfBounds");

    const ballPositionYardLine = DistanceConverter.toYardLine(
      adjustedBallPositionForTeam.x
    );

    const ballPositionYardLineStr = MessageFormatter.formatYardAndHalfStr(
      ballPositionYardLine,
      adjustedBallPositionForTeam.x
    );

    this._playData.pushDescription(
      `${kicker.name} kickoff kicked out of bounds`
    );

    Chat.send(
      `${ICONS.Pushpin} Ball went out of bounds ${ballPositionYardLineStr}`
    );

    // If it is a penalty, set it where the ball went out of boounds
    this.endPlay({ newLosX: adjustedBallPositionForTeam.x });
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

    // Dont check for safety here, since safety has its own way of handling, which is not a penalty
    if (penaltyName === "ballOutOfBounds") {
      this._handlePenalty("kickOffOutOfBounds", player);
      // return this.endPlay({ newLosX: offenseFortyYardLine });
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

    const { yardAndHalfStr } = this._getPlayDataOffense(
      ballContactObj.playerPosition
    );

    if (isOutOfBounds) {
      Chat.send(`${ICONS.DoNotEnter} Caught out of bounds ${yardAndHalfStr}`);
      return this._handleBallOutOfBounds(ballContactObj.playerPosition);
    }

    Chat.send(`${ICONS.Football} Ball Caught`);

    const kicker = this.getState("KickOffKicker");

    this._playData.pushDescription(
      `${kicker.name} kickoff caught ${yardAndHalfStr} by ${ballContactObj.player.name}`
    );

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
