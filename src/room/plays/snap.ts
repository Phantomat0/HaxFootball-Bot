import Room from "..";
import BallContact from "../classes/BallContact";
import PlayerContact from "../classes/PlayerContact";
import { PlayerObject, Position } from "../HBClient";
import Chat from "../roomStructures/Chat";
import Ball from "../structures/Ball";
import MapReferee from "../structures/MapReferee";
import SnapEvents from "./play_events/Snap.events";

// CASES
// 1. Pass out of bounds
// 2. Catch
// 3. Pass Deflection
// 4. Interception
// 5. Run
// 6. Illegal touch offense
// 7. Illegal blitz defebse
// 8. Ball blitzed defense

export default class Snap extends SnapEvents {
  private _quarterback: PlayerObject;
  constructor(time: number, quarterback: PlayerObject) {
    super(time);
    this._quarterback = quarterback;
    this._ballCarrier = quarterback;
  }

  getQuarterback() {
    return this._quarterback;
  }

  protected _handleCatch(ballContactObj: BallContact) {
    const { player, playerPosition } = ballContactObj;
    const { name } = player;

    const isOutOfBounds = MapReferee.checkIfPlayerOutOfBounds(playerPosition);

    if (isOutOfBounds) {
      Chat.send(`Pass Incomplete, caught out of bounds by ${name}`);
      // return resetBall();
      return;
    }

    this.setState("ballCaught");
    Chat.send(`Pass caught by ${name}`);
    this.setBallCarrier(player);
  }

  protected _handleRun(playerContactObj: PlayerContact) {
    const { player } = playerContactObj;

    Chat.send("RUN");

    // sendPlayMessage({ type: PLAY_TYPES.RUN, playerName: player.name });

    this.setBallCarrier(player).setState("ballRan");
  }

  protected _handleIllegalTouch(ballContactObj: BallContact) {
    Chat.send("ILLEGAL TOUCH");

    this._setLivePlay(false);
  }

  protected _handleBallContactQuarterback(ballContactObj: BallContact) {
    const { type } = ballContactObj;

    // QB tries to catch their own pass
    const qbContactAfterPass = this.getState("ballPassed");
    if (qbContactAfterPass) return;

    // QB touched the ball before the pass
    const qbTouchedBall = type === "touch";
    if (qbTouchedBall) return;

    // QB kicks the ball, aka passes
    const qbKicksBall = type === "kick";
    if (qbKicksBall) {
      this.setState("ballPassed");
      return Chat.send("Ball Passed!");
    }
  }

  protected _handleBallContactOffense(ballContactObj: BallContact) {
    if (this.getState("ballDeflected"))
      return this._handleBallContactDuringInterception(ballContactObj);

    const { player } = ballContactObj;
    const { id } = player;

    // If contact was made by QB, handle it seperately
    const isQBContact = id === this.getQuarterback().id;
    if (isQBContact) return this._handleBallContactQuarterback(ballContactObj);

    // Receiver touched but there wasnt a pass yet
    const touchButNoQbPass = this.getState("ballPassed") === null;
    if (touchButNoQbPass) return this._handleIllegalTouch(ballContactObj);

    // Has to be a catch
    this._handleCatch(ballContactObj);
  }

  protected _handleBallContactDuringInterception(ballContactObj: BallContact) {
    // If anyone but the intercepting player touches the ball, reset play
    const interceptingPlayer = this.getState("interceptingPlayer");
    if (interceptingPlayer.id !== ballContactObj.player.id) {
      Chat.send("Someone else touched");
      return this._setLivePlay(false);
    }

    // Ok now we know the contacts are from the intercepting player, lets check for the kick time
    const firstTouchTime = this.getState("interceptFirstTouchTime");
    const differenceFromFirstTouchToTimeNow =
      Room.game.getTime() - firstTouchTime;

    const INTERCEPTION_TIME_LIMIT = 5;

    if (differenceFromFirstTouchToTimeNow > INTERCEPTION_TIME_LIMIT) {
      Chat.send("Sorry time expired");
      return this._setLivePlay(false);
    }
  }

  protected _handleBallContactDefense(ballContactObj: BallContact) {
    // If the ball wasn't passed yet, ball must have been blitzed
    if (!this.getState("ballPassed")) return this.setState("ballBlitzed");

    if (this.getState("ballDeflected"))
      return this._handleBallContactDuringInterception(ballContactObj);

    Chat.send("Deflection!");
    this.setState("ballDeflected");
    this.setBallCarrier(ballContactObj.player);
    Room.game.swapOffense();
    Room.game.players.updateStaticPlayerList(
      Room.game.offenseTeamId,
      this.getQuarterback().id
    );
    console.log(Room.game.offenseTeamId);
    console.log(Room.game.players.getDefense());
    this.setState("interceptingPlayer", ballContactObj.player);
    this.setState("interceptFirstTouchTime", Room.game.getTime());

    // this._setLivePlay(false);
  }

  _handleSuccessfulInterception() {
    Chat.send("Successful Int!");

    this.setState("interceptionRuling");
    this.setState("interceptionSuccessful");

    const endPosition = this.getState("interceptionPlayerEndPosition");

    if (!endPosition) return;

    Chat.send("we have a tackle position");

    Ball.setPosition(endPosition as Position);
    this._setLivePlay(false);
  }

  _handleInterceptionOutOfBounds(ballCarrierPosition: Position) {
    // If there was a ruling on if the int was good or not and it was successful, handle the tackle
    if (
      this.getState("interceptionRuling") &&
      this.getState("interceptionSuccessful")
    ) {
      Chat.send("OUT OF BOUNDS DURING ITN");
      this._setLivePlay(false);
    }

    this.setState("interceptionPlayerEndPosition", ballCarrierPosition);
  }

  _handleTackle(playerContact: PlayerContact) {
    Chat.send("TACKLE!");

    this._setLivePlay(false);
  }

  _handleInterceptionTackle(playerContactObj: PlayerContact) {
    // If there was a ruling on if the int was good or not and it was successful, handle the tackle
    if (
      this.getState("interceptionRuling") &&
      this.getState("interceptionSuccessful")
    )
      return this._handleTackle(playerContactObj);

    // If there hasn't been a ruling yet on the int, save the tackle position
    this.setState(
      "interceptionPlayerEndPosition",
      playerContactObj.playerPosition
    );
  }

  // onKickDrag(dragAmount) {
  //   handlePenalty({
  //     type: PENALTY_TYPES.SNAP_DRAG,
  //     playerName: this._quarterback.name,
  //   });
  // }

  // handleIllegalCrossOffense() {
  //   handlePenalty({
  //     type: PENALTY_TYPES.ILLEGAL_LOS_CROSS,
  //     playerName: this._quarterback.name,
  //   });
  // }

  // #handleIllegalTouch(playerName) {
  //   handlePenalty({ type: PENALTY_TYPES.ILLEGAL_PASS, playerName: playerName });
  // }

  // handleAutoTouchdown() {
  //   // After three redzone penalties

  //   Chat.send(`AUTO TOUCHDOWN!`);

  //   this.scorePlay(7, game.getOffenseTeam());
  // }
}
