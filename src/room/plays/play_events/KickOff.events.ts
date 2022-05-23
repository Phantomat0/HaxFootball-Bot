import Room from "../..";
import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { PlayerObject, PlayerObjFlat, Position } from "../../HBClient";
import Chat from "../../roomStructures/Chat";
import Ball from "../../structures/Ball";
import GameReferee from "../../structures/GameReferee";
import MapReferee from "../../structures/MapReferee";
import PreSetCalculators from "../../structures/PreSetCalculators";
import ICONS from "../../utils/Icons";
import BasePlay from "../BasePlay";

export interface KickOffStore {
  kickOff: true;
  kickOffCaught: true;
  kickOffKicked: true;
  KickOffKicker: PlayerObjFlat;
  catchPosition: Position;
  safetyKickoff: true;
}

export default abstract class KickOffEvents extends BasePlay<KickOffStore> {
  validateBeforePlayBegins(player: PlayerObject | null): void {
    // No validations, since this is run by the bot never the player :)
  }

  /**
   * The kickoff position is either at the 50, or at the defenive team's 20 in the case of a safety
   */
  private _determineKickOffPosition(): Position {
    const isKickOffAfterSafety = this.stateExists("safetyKickoff");

    console.log({ isKickOffAfterSafety });

    const offenseTwentyYardLine = PreSetCalculators.getPositionOfTeamYard(
      20,
      Room.game.offenseTeamId
    );

    if (isKickOffAfterSafety) return { x: offenseTwentyYardLine, y: 0 };

    // Otherwsie just set it at the 50
    return { x: 0, y: 0 };
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

  handleBallCarrierContactDefense(playerContact: PlayerContact): void {
    const { endPosition, netYards, yardAndHalfStr } = this._getPlayDataOffense(
      playerContact.ballCarrierPosition
    );

    Chat.send(`${ICONS.HandFingersSpread} Tackle ${yardAndHalfStr}`);

    const catchPosition = this.getState("catchPosition");

    const { isSafety, isTouchback } =
      GameReferee.checkIfSafetyOrTouchbackPlayer(
        catchPosition,
        endPosition,
        Room.game.offenseTeamId
      );

    if (isSafety) return super.handleSafety();
    if (isTouchback) return super.handleTouchback();

    this.endPlay({
      newLosX: endPosition.x,
      netYards,
      resetDown: true,
    });
  }

  handleBallCarrierContactOffense(playerContact: PlayerContact): void {
    // Nothing interesting happens since we dont allow runs on kickoff
  }

  handleBallCarrierOutOfBounds(ballCarrierPosition: Position): void {
    const catchPosition = this.getState("catchPosition");

    const { isSafety, isTouchback } =
      GameReferee.checkIfSafetyOrTouchbackPlayer(
        catchPosition,
        ballCarrierPosition,
        Room.game.offenseTeamId
      );

    if (isSafety) return super.handleSafety();
    if (isTouchback) return super.handleTouchback();

    const { endPosition, netYards, yardAndHalfStr } =
      this._getPlayDataOffense(ballCarrierPosition);

    Chat.send(
      `${this.getBallCarrier().name} went out of bounds ${yardAndHalfStr}`
    );

    console.log(this._startingPosition, endPosition, netYards);

    this.endPlay({ newLosX: endPosition.x, resetDown: true });
  }

  handleBallContact(ballContactObj: BallContact): void {
    if (this.stateExists("kickOffCaught")) return;
    super.handleBallContact(ballContactObj);
  }

  handleBallOutOfBounds(ballPosition: Position): void {
    const kicker = this.getState("KickOffKicker");

    // Check if its a safety or not, if its a safety its defense 40 yard line
    const offenseFortyYardLine = PreSetCalculators.getPositionOfTeamYard(
      40,
      Room.game.offenseTeamId
    );

    const defenseFortyYardLine = PreSetCalculators.getPositionOfTeamYard(
      40,
      Room.game.defenseTeamId
    );

    const newLosX = this.stateExists("safetyKickoff")
      ? defenseFortyYardLine
      : offenseFortyYardLine;

    const penaltyType = this.stateExists("safetyKickoff")
      ? "kickOffOffsidesSafety"
      : "kickOffOutOfBounds";

    this._handlePenalty(penaltyType, kicker);

    this.endPlay({ newLosX: newLosX, resetDown: true });
  }

  onKickDrag(player: PlayerObjFlat | null): void {
    const fieldedPlayers = Room.game.players.getFielded();

    // We have to get the closest player to the ball to determine the kicker, since it could be anyone
    const playerClosestToBall = MapReferee.getClosestPlayerToBall(
      Ball.getPosition(),
      fieldedPlayers
    );

    // We swap offense since the swap happens on the kick, and we haven't kicked it yet
    if (this.stateExists("kickOffKicked") === false) {
      Room.game.swapOffenseAndUpdatePlayers();
    }

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

    const penaltyType = this.stateExists("safetyKickoff")
      ? "kickOffDragSafety"
      : "kickOffDrag";

    this._handlePenalty(penaltyType, playerClosestToBall);

    this.endPlay({ newLosX: newLosX, resetDown: true });
  }
}
