import Room from "../..";
import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { PlayerObject, PlayerObjFlat, Position } from "../../HBClient";
import Chat from "../../roomStructures/Chat";
import Ball from "../../structures/Ball";
import GameReferee from "../../structures/GameReferee";
import MapReferee from "../../structures/MapReferee";
import PreSetCalculators from "../../structures/PreSetCalculators";
import BasePlay from "../BasePlay";

export interface KickOffStore {
  kickOff: true;
  kickOffCaught: true;
  kickOffKicked: true;
  KickOffKicker: PlayerObjFlat;
}

export default abstract class KickOffEvents extends BasePlay<KickOffStore> {
  validateBeforePlayBegins(player: PlayerObject | null): void {
    // No validations, since this is run by the bot never the player :)
  }

  /**
   * The kickoff position is either at the 50, or at the defenive team's 20 in the case of a safety
   */
  private _determineKickOffPosition(): Position {
    const isKickOffAfterSafety = Room.game.stateExists("safetyKickoff");

    const offenseTwentyYardLine = PreSetCalculators.getPositionOfTeamYard(
      20,
      Room.game.offenseTeamId
    );

    if (isKickOffAfterSafety) return { x: offenseTwentyYardLine, y: 0 };

    // Otherwsie just set it at the 50
    return { x: 0, y: 0 };
  }

  prepare() {
    const kickOffPosition = this._determineKickOffPosition();
    Ball.setPosition(kickOffPosition);
    this.setBallPositionOnSet(kickOffPosition);
    Room.game.down.setLOS(kickOffPosition.x);
    Room.game.down.moveFieldMarkers({ hideLineToGain: true });
  }

  run(): void {
    this._setLivePlay(true);
    Ball.release();
    this.setState("kickOff");
  }

  handleBallCarrierContactDefense(playerContact: PlayerContact): void {
    // Tackle

    const { endPosition, netYards, endYard } = this._getPlayDataOffense(
      playerContact.ballCarrierPosition
    );

    Chat.send(
      `${playerContact.player.name} tackled the ball carrier at the ${endYard}`
    );

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
    const isSafety = GameReferee.checkIfSafetyPlayer(
      ballCarrierPosition,
      Room.game.offenseTeamId
    );

    if (isSafety) return super.handleSafety();

    const { endPosition, netYards, endYard } =
      this._getPlayDataOffense(ballCarrierPosition);

    Chat.send(
      `${this.getBallCarrier().name} went out of bounds at the ${endYard}`
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

    const newLosX = Room.game.stateExists("safetyKickoff")
      ? defenseFortyYardLine
      : offenseFortyYardLine;

    const penaltyType = Room.game.stateExists("safetyKickoff")
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
    const newLosX = Room.game.stateExists("safetyKickoff")
      ? defenseFortyYardLine
      : offenseFortyYardLine;

    const penaltyType = Room.game.stateExists("safetyKickoff")
      ? "kickOffDragSafety"
      : "kickOffDrag";

    this._handlePenalty(penaltyType, playerClosestToBall);

    this.endPlay({ newLosX: newLosX, resetDown: true });
  }
}
