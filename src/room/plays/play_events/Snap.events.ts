import Room from "../..";
import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { PlayableTeamId, PlayerObject, Position } from "../../HBClient";
import Chat from "../../roomStructures/Chat";
import Ball from "../../structures/Ball";
import { GameCommandError } from "../../commands/GameCommandHandler";
import GameReferee from "../../structures/GameReferee";
import MapReferee from "../../structures/MapReferee";
import {
  AdditionalPenaltyData,
  PenaltyName,
} from "../../structures/PenaltyDataGetter";
import { getPlayerDiscProperties } from "../../utils/haxUtils";
import ICONS from "../../utils/Icons";
import { MAP_POINTS } from "../../utils/map";
import { MapSectionName } from "../../utils/MapSectionFinder";
import BasePlay from "../BasePlay";
import { BadIntReasons } from "../Snap";

class SnapValidatorPenalty<T extends PenaltyName> {
  penaltyName: T;
  player: PlayerObject;
  penaltyData: AdditionalPenaltyData;

  constructor(
    penaltyName: T,
    player: PlayerObject,
    penaltyData: AdditionalPenaltyData = {}
  ) {
    this.penaltyName = penaltyName;
    this.player = player;
    this.penaltyData = penaltyData;
  }
}

class SnapValidator {
  private _player: PlayerObject;
  private _playerPosition: Position;

  constructor(player: PlayerObject) {
    this._player = player;
    this._playerPosition = getPlayerDiscProperties(this._player.id)?.position;
  }

  private _checkSnapOutOfBounds(): never | void {
    const isOutOfBounds = MapReferee.checkIfPlayerOutOfBounds(
      this._playerPosition
    );

    if (isOutOfBounds)
      throw new SnapValidatorPenalty("snapOutOfBounds", this._player);
  }

  private _checkSnapWithinHashes(): never | void {
    const isWithinHash = MapReferee.checkIfWithinHash(
      this._playerPosition,
      MAP_POINTS.PLAYER_RADIUS
    );

    if (!isWithinHash)
      throw new SnapValidatorPenalty("snapOutOfHashes", this._player);
  }

  private _checkOffsideOffense(): never | void {
    const offsidePlayer = MapReferee.findTeamPlayerOffside(
      Room.game.players.getOffense(),
      Room.game.offenseTeamId,
      Room.game.down.getLOS().x
    );

    if (offsidePlayer)
      throw new SnapValidatorPenalty("offsidesOffense", offsidePlayer);
  }

  private _checkOffsideDefense(): never | void {
    const offsidePlayer = MapReferee.findTeamPlayerOffside(
      Room.game.players.getDefense(),
      Room.game.defenseTeamId,
      Room.game.down.getLOS().x
    );

    if (offsidePlayer)
      throw new SnapValidatorPenalty("offsidesDefense", offsidePlayer);
  }

  validate() {
    try {
      this._checkSnapWithinHashes();
      this._checkSnapOutOfBounds();
      this._checkOffsideOffense();
      this._checkOffsideDefense();
    } catch (e) {
      if (e instanceof SnapValidatorPenalty) {
        const { penaltyName, player, penaltyData } =
          e as SnapValidatorPenalty<any>;

        return {
          valid: false,
          penaltyName: penaltyName,
          player: player,
          penaltyData: penaltyData,
        };
      }

      console.log(e);
    }

    return {
      valid: true,
    };
  }
}

export interface SnapStore {
  curvePass: true;
  ballSnapped: true;
  ballPassed: true;
  ballCaught: true;
  catchPosition: Position;
  ballDeflected: true;
  ballRan: true;
  canBlitz: true;
  ballBlitzed: true;
  lineBlitzed: true;
  interceptionAttempt: true;
  interceptionAttemptKicked: true;
  interceptingPlayer: PlayerObject;
  ballIntercepted: true;
  interceptionBallPositionFirstTouch: Position;
  interceptionRuling: boolean;
  interceptionPlayerEndPosition: Position;
  interceptionTackler: PlayerObject;
  interceptionPlayerKickPosition: Position;
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

  abstract handleUnsuccessfulInterception(message: BadIntReasons): any;
  protected abstract _getStatInfo(endPosition: Position): {
    quarterback: PlayerObject;
    mapSection: MapSectionName;
  };
  protected abstract _startBlitzClock(): void;

  validateBeforePlayBegins(player: PlayerObject | null) {
    if (Room.game.canStartSnapPlay === false)
      throw new GameCommandError(
        "Please wait a second before snapping the ball"
      );

    Room.game.updateStaticPlayers();

    Room.game.players.savePlayerPositions();

    const {
      valid,
      penaltyName,
      player: penaltiedPlayer,
      penaltyData,
    } = new SnapValidator(player as PlayerObject).validate();

    if (!valid) {
      this._handlePenalty(penaltyName!, penaltiedPlayer!, penaltyData);
      throw new GameCommandError("Penalty", false);
    }
  }

  async prepare() {
    Room.game.updateStaticPlayers();
    this._setStartingPosition(Room.game.down.getLOS());
    this.setBallPositionOnSet(Ball.getPosition());
    Room.game.down.moveFieldMarkers();
    this._startBlitzClock();

    const isCurvePass = Room.game.stateExists("curvePass");

    if (isCurvePass) this.setState("curvePass");
  }

  run() {
    this._setLivePlay(true);
    Ball.release();
    this.setState("ballSnapped");
    Chat.sendMessageMaybeWithClock(
      `${ICONS.GreenCircle} Ball is Hiked`,
      this.time
    );
  }

  handleBallOutOfBounds(ballPosition: Position) {
    // Check if this was a result of an int attempt
    if (this.stateExists("interceptionAttempt")) {
      const isSuccessfulInt =
        GameReferee.checkIfInterceptionSuccessful(ballPosition);

      if (isSuccessfulInt) return this._handleSuccessfulInterception();

      return this.handleUnsuccessfulInterception("Ball out of bounds");
    }

    const { mapSection } = this._getStatInfo(ballPosition);

    Room.game.stats.updatePlayerStat(this.getQuarterback().id, {
      passAttempts: {
        [mapSection]: 1,
      },
    });

    Chat.send(`${ICONS.DoNotEnter} Incomplete - Pass out of bounds!`);
    return this.endPlay({});
  }
  handleBallCarrierOutOfBounds(ballCarrierPosition: Position) {
    if (this.stateExists("interceptionAttempt"))
      return this._handleInterceptionBallCarrierOutOfBounds(
        ballCarrierPosition
      );

    const catchPosition = this.stateExists("catchPosition")
      ? this.getState("catchPosition")
      : null;

    const { endPosition, netYards, yardAndHalfStr } =
      this._getPlayDataOffense(ballCarrierPosition);

    Chat.send(
      `${ICONS.Pushpin} ${
        this.getBallCarrier().name
      } went out of bounds ${yardAndHalfStr}`
    );

    const { isSafety } = GameReferee.checkIfSafetyOrTouchbackPlayer(
      catchPosition,
      ballCarrierPosition,
      Room.game.offenseTeamId
    );

    // If the QB went out of bounds, or ball was ran add rushing stats
    if (
      this.getQuarterback().id === this._ballCarrier?.id ||
      this.stateExists("ballRan")
    ) {
      Room.game.stats.updatePlayerStat(this._ballCarrier?.id!, {
        rushingAttempts: 1,
        rushingYards: netYards,
      });
    } else {
      const catchPosition = this.getState("catchPosition");

      const { mapSection } = this._getStatInfo(catchPosition);

      Room.game.stats.updatePlayerStat(this._ballCarrier?.id!, {
        receptions: { [mapSection]: 1 },
        receivingYards: { [mapSection]: netYards },
      });

      Room.game.stats.updatePlayerStat(this.getQuarterback().id, {
        passYards: { [mapSection]: netYards },
      });
    }

    if (isSafety) return this.handleSafety();

    this.endPlay({ newLosX: endPosition.x, netYards });
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

    this._handlePenalty("illegalRun", player);
  }

  handleBallCarrierContactDefense(playerContact: PlayerContact) {
    if (this.stateExists("interceptingPlayer"))
      return this._handleInterceptionTackle(playerContact);

    this._handleTackle(playerContact);
  }

  /**
   * Determines whether the ball contact was offense or defense and handles
   */
  handleBallContact(ballContactObj: BallContact) {
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
    super.handleBallContact(ballContactObj);
  }
}
