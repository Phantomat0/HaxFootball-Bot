import Room from "../..";
import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { PlayerStatQuery } from "../../classes/PlayerStats";
import {
  PlayableTeamId,
  PlayerObject,
  PlayerObjFlat,
  Position,
} from "../../HBClient";
import Chat from "../../roomStructures/Chat";
import GameReferee from "../../structures/GameReferee";
import MapReferee from "../../structures/MapReferee";
import ICONS from "../../utils/Icons";
import { MapSectionName } from "../../utils/MapSectionFinder";
import BasePlay from "../BasePlay";
import { BadIntReasons } from "../Snap";

export interface SnapStore {
  curvePass: true;
  ballSnapped: true;
  ballPassed: true;
  ballCaught: true;
  catchPosition: Position;
  nearestDefenderToCatch: PlayerObject;
  ballDeflected: true;
  ballRan: true;
  ballDragged: true;
  canBlitz: true;
  ballBlitzed: true;
  lineBlitzed: true;
  interceptionAttempt: true;
  interceptionAttemptKicked: true;
  interceptingPlayer: PlayerObjFlat;
  ballIntercepted: true;
  interceptionBallPositionFirstTouch: Position;
  interceptionRuling: boolean;
  interceptionPlayerEndPosition: Position;
  interceptionTackler: PlayerObject;
  interceptionPlayerKickPosition: Position;
  twoPointAttempt: true;
}

export default abstract class SnapEvents extends BasePlay<SnapStore> {
  abstract getQuarterback(): any;
  protected abstract _handleCatch(ballContactObj: BallContact): any;
  protected abstract _handleRun(playerContactObj: PlayerContact): any;
  protected abstract _handleIllegalTouch(ballContactObj: BallContact): any;
  protected abstract _handleBallContactQuarterback(
    ballContactObj: BallContact
  ): any;
  protected abstract _handleSuccessfulInterception(): any;
  protected abstract _handleInterceptionTackle(
    playerContactObj: PlayerContact
  ): any;
  protected abstract _handleTackle(playerContactObj: PlayerContact): any;
  protected abstract _handleBallContactDuringInterception(
    ballContactObj: BallContact
  ): any;
  protected abstract _handleInterceptionBallCarrierOutOfBounds(
    ballCarrierPosition: Position
  ): any;
  protected abstract _handleInterceptionAttempt(ballContactObj: BallContact);

  abstract handleUnsuccessfulInterception(message: BadIntReasons): any;
  protected abstract _getStatInfo(endPosition: Position): {
    quarterback: PlayerObject;
    mapSection: MapSectionName;
  };
  protected abstract _startBlitzClock(): void;
  protected abstract _startBallMoveBlitzClock(): void;
  protected abstract _updateStatsIfNotTwoPoint(
    playerId: PlayerObject["id"],
    statsQuery: Partial<PlayerStatQuery>
  ): void;

  /**
   * Determines whether the ball contact was offense or defense and handles
   */
  onBallContact(ballContactObj: BallContact) {
    // Normally if any of these states were true, our eventlistener wouldnt run
    // but handleBallContact can also be run from our onPlayerBallKick
    if (
      this.stateExists("ballCaught") ||
      this.stateExists("ballRan") ||
      this.stateExists("ballBlitzed")
    )
      return;

    // Handle any contact during an int seperately
    if (this.stateExists("interceptionAttempt"))
      return this._handleBallContactDuringInterception(ballContactObj);

    // Run the native one
    super.onBallContact(ballContactObj);
  }

  onBallOutOfBounds(ballPosition: Position) {
    // Check if this was a result of an int attempt
    if (this.stateExists("interceptionAttempt")) {
      const isSuccessfulInt =
        GameReferee.checkIfInterceptionSuccessful(ballPosition);

      if (isSuccessfulInt) return this._handleSuccessfulInterception();

      return this.handleUnsuccessfulInterception("Ball out of bounds");
    }

    const { mapSection } = this._getStatInfo(ballPosition);

    this._updateStatsIfNotTwoPoint(this.getQuarterback().id, {
      passAttempts: {
        [mapSection]: 1,
      },
    });

    Chat.send(`${ICONS.DoNotEnter} Incomplete - Pass out of bounds!`);
    return this.endPlay({});
  }
  onBallCarrierOutOfBounds(ballCarrierPosition: Position) {
    if (this.stateExists("interceptionAttempt"))
      return this._handleInterceptionBallCarrierOutOfBounds(
        ballCarrierPosition
      );

    const startPosition = this.stateExists("catchPosition")
      ? this.getState("catchPosition")
      : this._startingPosition;

    const {
      endPosition,
      netYards,
      yardAndHalfStr,
      netYardsStr,
      yardsPassed,
      yardsAfterCatch,
    } = this._getPlayDataOffense(ballCarrierPosition);

    Chat.send(
      `${ICONS.Pushpin} ${
        this.getBallCarrier().name
      } went out of bounds ${yardAndHalfStr} | ${netYardsStr}`
    );

    const { isSafety } = GameReferee.checkIfSafetyOrTouchbackPlayer(
      startPosition,
      endPosition,
      Room.game.offenseTeamId
    );

    // If the QB went out of bounds, or ball was ran add rushing stats
    if (
      this.getQuarterback().id === this._ballCarrier?.id ||
      this.stateExists("ballRan")
    ) {
      this._updateStatsIfNotTwoPoint(this._ballCarrier?.id!, {
        rushingAttempts: 1,
        rushingYards: netYards,
      });
    } else {
      const catchPosition = this.getState("catchPosition");

      const { mapSection } = this._getStatInfo(catchPosition);

      this._updateStatsIfNotTwoPoint(this._ballCarrier?.id!, {
        receptions: { [mapSection]: 1 },
        receivingYards: { [mapSection]: netYards },
        receivingYardsAfterCatch: { [mapSection]: yardsAfterCatch },
      });

      if (this.stateExists("nearestDefenderToCatch")) {
        const nearestDefenerToCatch = this.getState("nearestDefenderToCatch");

        this._updateStatsIfNotTwoPoint(nearestDefenerToCatch.id, {
          yardsAllowed: { [mapSection]: netYards },
        });
      }

      this._updateStatsIfNotTwoPoint(this.getQuarterback().id, {
        passYards: { [mapSection]: netYards },
        passYardsDistance: { [mapSection]: yardsPassed },
      });
    }

    if (isSafety) return this._handleSafety();

    this.endPlay({ newLosX: endPosition.x, netYards });
  }

  onBallCarrierContactOffense(playerContact: PlayerContact) {
    const { player, playerPosition, ballCarrierPosition } = playerContact;
    // Verify that its a legal run

    // fumbleCheck(playerSpeed, ballCarrierSpeed)

    // // const { playerSpeed, ballCarrierSpeed } = playerContact;

    // Chat.send(`X: ${Math.abs(playerSpeed.x).toFixed(3)}`);
    // Chat.send(`Total: ${Math.abs(playerSpeed.x).toFixed(3)}`);

    // Chat.send(`XBALLGUY: ${Math.abs(ballCarrierSpeed.x).toFixed(3)}`);
    // Chat.send(
    //   `TOTAL: ${(
    //     Math.abs(ballCarrierSpeed.x) + Math.abs(playerSpeed.x)
    //   ).toFixed(3)}`
    // );

    // Chat.send(
    //   `X: ${playerSpeed.x.toFixed(3)} Y: ${playerSpeed.y.toFixed(
    //     3
    //   )} || X: ${ballCarrierSpeed.x.toFixed(3)} Y: ${ballCarrierSpeed.y.toFixed(
    //     3
    //   )}`
    // );
    // Chat.send(
    //   `TOTAL: ${(
    //     Math.abs(playerSpeed.x) +
    //     Math.abs(playerSpeed.y) +
    //     Math.abs(ballCarrierSpeed.x) +
    //     Math.abs(ballCarrierSpeed.y)
    //   ).toFixed(3)}`
    // );

    const isBehindQuarterBack = MapReferee.checkIfBehind(
      playerPosition.x,
      ballCarrierPosition.x,
      player.team as PlayableTeamId
    );

    // If its a legal run, handle it, otherwise its a penalty
    if (isBehindQuarterBack) return this._handleRun(playerContact);

    this._handlePenalty("illegalRun", player);
  }

  onBallCarrierContactDefense(playerContact: PlayerContact) {
    if (this.stateExists("interceptingPlayer"))
      return this._handleInterceptionTackle(playerContact);

    this._handleTackle(playerContact);
  }

  onKickDrag(player: PlayerObjFlat | null) {
    // this._handlePenalty("snapDrag", player!);
    this.setState("ballDragged");
    this._startBallMoveBlitzClock();
  }

  protected _onBallContactDefense(ballContactObj: BallContact) {
    // If the ball wasn't passed yet, ball must have been blitzed
    if (!this.stateExists("ballPassed")) return this.setState("ballBlitzed");

    const { mapSection } = this._getStatInfo(ballContactObj.playerPosition);

    this._updateStatsIfNotTwoPoint(ballContactObj.player.id, {
      passDeflections: { [mapSection]: 1 },
    });

    this._updateStatsIfNotTwoPoint(this.getQuarterback().id, {
      passAttempts: { [mapSection]: 1 },
    });

    Chat.send(`${ICONS.DoNotEnter} Incomplete - Pass Deflected`);
    this.setState("ballDeflected");

    this._handleInterceptionAttempt(ballContactObj);
  }

  protected _onBallContactOffense(ballContactObj: BallContact) {
    if (this.stateExists("ballDeflected"))
      return this._handleBallContactDuringInterception(ballContactObj);

    const { player } = ballContactObj;
    const { id } = player;

    // If contact was made by QB, handle it seperately
    const isQBContact = id === this.getQuarterback().id;
    if (isQBContact) return this._handleBallContactQuarterback(ballContactObj);

    // Receiver touched but there wasnt a pass yet
    const touchButNoQbPass = this.stateExists("ballPassed") === false;
    if (touchButNoQbPass) return this._handleIllegalTouch(ballContactObj);

    // Has to be a catch
    this._handleCatch(ballContactObj);
  }
}
