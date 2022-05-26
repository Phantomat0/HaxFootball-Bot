import Room from "../..";
import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { PlayableTeamId, PlayerObjFlat, Position } from "../../HBClient";
import Chat from "../../roomStructures/Chat";
import Ball from "../../structures/Ball";
import GameReferee from "../../structures/GameReferee";
import MapReferee from "../../structures/MapReferee";
import { quickPause } from "../../utils/haxUtils";
import ICONS from "../../utils/Icons";
import BasePlay from "../BasePlay";

export interface FieldGoalStore {
  fieldGoal: true;
  fieldGoalKicked: true;
  fieldGoalLineBlitzed: true;
  fieldGoalBlitzed: true;
  ballRan: true;
}

export default abstract class FieldGoalEvents extends BasePlay<FieldGoalStore> {
  protected abstract _getKicker(): PlayerObjFlat;
  protected abstract _setPlayersInPosition(): void;
  protected abstract _handleTackle(playerContactObj: PlayerContact): any;
  protected abstract _handleRun(playerContact: PlayerContact): any;

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
  handleBallOutOfBounds(ballPosition: Position) {
    // This actually will never run since we stop play when the ball leaves the hashes
  }
  handleBallCarrierOutOfBounds(ballCarrierPosition: Position) {
    // Out of bounds like always, check for safety etc
    const { endPosition, netYards, yardAndHalfStr } =
      this._getPlayDataOffense(ballCarrierPosition);

    Chat.send(
      `${ICONS.Pushpin} ${
        this.getBallCarrier().name
      } went out of bounds ${yardAndHalfStr}`
    );

    const { isSafety, isTouchback } =
      GameReferee.checkIfSafetyOrTouchbackPlayer(
        Room.game.down.getLOS(),
        ballCarrierPosition,
        Room.game.offenseTeamId
      );

    // Always add rushing stats
    Room.game.stats.updatePlayerStat(this._ballCarrier?.id!, {
      rushingAttempts: 1,
      rushingYards: netYards,
    });

    if (isSafety) return this.handleSafety();
    if (isTouchback) return this.handleTouchback();

    this.endPlay({ newLosX: endPosition.x, netYards });
  }
  handleBallCarrierContactOffense(playerContact: PlayerContact) {
    const { player, playerPosition, ballCarrierPosition } = playerContact;

    const isBehindKicker = MapReferee.checkIfBehind(
      playerPosition.x,
      ballCarrierPosition.x,
      player.team as PlayableTeamId
    );

    // If its a legal run, handle it, otherwise its a penalty
    if (isBehindKicker) return this._handleRun(playerContact);

    // Cant run when the ball has already been kicked
    if (this.stateExists("fieldGoalKicked")) return;

    this._handlePenalty("illegalRun", player);
  }
  handleBallCarrierContactDefense(playerContact: PlayerContact) {
    this._handleTackle(playerContact);
  }

  handleBallContact(ballContactObj: BallContact) {
    // We have to do this check AGAIN because playerOnkick is not an event listener, but a native listener
    if (this.stateExists("ballRan") || this.stateExists("fieldGoalBlitzed"))
      return;

    super.handleBallContact(ballContactObj);
  }
}
