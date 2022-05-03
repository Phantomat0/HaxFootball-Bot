import Room from "../..";
import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { PlayableTeamId, Position } from "../../HBClient";
import Chat from "../../roomStructures/Chat";
import GameReferee from "../../structures/GameReferee";
import MapReferee from "../../structures/MapReferee";
import BasePlay from "../BasePlay";

export type SNAP_PLAY_STATES =
  | "ballSnapped"
  | "ballPassed"
  | "ballCaught"
  | "ballDeflected"
  | "ballRan"
  | "ballBlitzed"
  | "ballIntercepted"
  | "blitzed"
  | "interceptingPlayer"
  | "interceptFirstTouchTime"
  | "interceptionRuling"
  | "interceptionSuccessful"
  | "interceptionPlayerEndPosition";

export default abstract class SnapEvents extends BasePlay<SNAP_PLAY_STATES> {
  abstract getQuarterback(): any;
  protected abstract _handleCatch(ballContactObj: BallContact): any;
  protected abstract _handleRun(playerContactObj: PlayerContact): any;
  protected abstract _handleIllegalTouch(ballContactObj: BallContact): any;
  protected abstract _handleBallContactQuarterback(
    ballContactObj: BallContact
  ): any;
  protected abstract _handleBallContactOffense(
    ballContactObj: BallContact
  ): any;
  protected abstract _handleBallContactDefense(
    ballContactObj: BallContact
  ): any;
  protected abstract _handleSuccessfulInterception(): any;
  protected abstract _handleInterceptionTackle(
    playerContactObj: PlayerContact
  ): any;
  protected abstract _handleTackle(playerContactObj: PlayerContact): any;
  protected abstract _handleInterceptionOutOfBounds(
    ballCarrierPosition: Position
  );

  validateBeforePlayBegins(): {
    valid: boolean;
    message?: string;
    sendToPlayer?: boolean;
  } {
    Room.game.updateStaticPlayers();
    console.log(Room.game.players.getDefense());
    console.log(Room.game.players.getOffense());
    // Check if they can even run the command
    return {
      valid: true,
    };

    // Check for penalties
  }

  run() {
    Room.game.updateStaticPlayers();
    this._setLivePlay(true);
    this.setState("ballSnapped");
  }

  handleBallOutOfBounds(ballPosition: Position) {
    Chat.send(`Ball went out of bounds!`);

    // First, check if there was an int, there was an int accempt and it was succesfful
    const isInt =
      this.getState("interceptingPlayer") &&
      GameReferee.checkIfInterceptionSuccessful(ballPosition);

    if (isInt) return this._handleSuccessfulInterception();

    const isSafety = GameReferee.checkIfSafetyBall(
      ballPosition,
      Room.game.offenseTeamId
    );
    if (isSafety) return super.handleSafety();

    this._setLivePlay(false);

    // resetBall();
  }
  handleBallCarrierOutOfBounds(ballCarrierPosition: Position) {
    if (this.getState("interceptingPlayer"))
      return this._handleInterceptionOutOfBounds(ballCarrierPosition);
    const isSafety = GameReferee.checkIfSafetyPlayer(
      ballCarrierPosition,
      Room.game.offenseTeamId
    );

    if (isSafety) return super.handleSafety();

    Chat.send("Out of bounds");

    this._setLivePlay(false);
  }

  handleBallCarrierContactOffense(playerContact: PlayerContact) {
    const { player, playerPosition, ballCarrierPosition } = playerContact;
    // Verify that its a legal run

    // fumbleCheck(playerSpeed, ballCarrierSpeed)

    // Chat.send(`X: ${playerSpeed.x.toFixed(3)} Y: ${playerSpeed.y.toFixed(3)} || X: ${ballCarrierSpeed.x.toFixed(3)} Y: ${ballCarrierSpeed.y.toFixed(3)}`)
    // Chat.send(`TOTAL: ${(Math.abs(playerSpeed.x) + Math.abs(playerSpeed.y) + Math.abs(ballCarrierSpeed.x) + Math.abs(ballCarrierSpeed.y)).toFixed(3)}`)

    const isBehindQuarterBack = MapReferee.checkIfBehind(
      playerPosition.x,
      ballCarrierPosition.x,
      player.team as PlayableTeamId
    );

    // If its a legal run, handle it, otherwise its a penalty
    if (isBehindQuarterBack) return this._handleRun(playerContact);

    Chat.send("Illegal Run");

    this._setLivePlay(false);

    // handlePenalty({
    //   type: PENALTY_TYPES.ILLEGAL_RUN,
    //   playerName: player.name,
    // });

    // Might need to adjust the player's position here, but for now, nahhh lmao
  }

  handleBallCarrierContactDefense(playerContact: PlayerContact) {
    if (this.getState("interceptingPlayer"))
      return this._handleInterceptionTackle(playerContact);

    this._handleTackle(playerContact);

    // const { player, playerPosition, ballCarrierPosition } = playerContact;
    // const { team, name } = this.getBallCarrier();
    // const { netYards, endPosition, endYard, mapSection } = super.getPlayData(
    //   ballCarrierPosition,
    //   team
    // );
    // const isSack = checkIfBehind(endPosition, down.getLOS(), team);
    // const isSafety = checkIfSafetyPlayer(ballCarrierPosition, team);
    // if (isSafety) return super.handleSafety();
    // this.endPlay({ netYards: netYards, endPosition: endPosition });
  }

  /**
   * Determines whether the ball contact was offense or defense and handles
   */
  handleBallContact(ballContactObj: BallContact) {
    console.log("WE GOT BALL CONTACT", ballContactObj.type);

    console.log(this.readAllState());
    // Normally if any of these states were true, our eventlistener wouldnt run
    // but handleBallContact can also be run from our onPlayerBallKick
    if (
      this.getState("ballCaught") ||
      this.getState("ballRan") ||
      this.getState("ballBlitzed")
    )
      return;

    console.log("WE GOT HERE");

    const {
      player: { team },
    } = ballContactObj;

    console.log(team);

    return team === Room.game.offenseTeamId
      ? this._handleBallContactOffense(ballContactObj)
      : this._handleBallContactDefense(ballContactObj);
  }
}
