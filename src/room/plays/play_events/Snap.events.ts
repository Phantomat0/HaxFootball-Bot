import Room from "../..";
import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { PlayableTeamId, PlayerObject, Position } from "../../HBClient";
import Chat from "../../roomStructures/Chat";
import Ball from "../../structures/Ball";
import GameReferee from "../../structures/GameReferee";
import MapReferee from "../../structures/MapReferee";
import {
  AdditionalPenaltyData,
  PenaltyName,
} from "../../structures/PenaltyDataGetter";
import { getPlayerDiscProperties } from "../../utils/haxUtils";
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
  interceptFirstTouchTime: number;
  interceptionRuling: boolean;
  interceptionPlayerEndPosition: Position;
  interceptionTackler: PlayerObject;
}

export default abstract class SnapEvents extends BasePlay<SnapStore> {
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

  validateBeforePlayBegins(player: PlayerObject): {
    valid: boolean;
    message?: string;
    sendToPlayer?: boolean;
  } {
    Room.game.updateStaticPlayers();
    console.log(Room.game.players.getDefense());
    console.log(Room.game.players.getOffense());

    const playerIsOnOffense = player.team === Room.game.offenseTeamId;
    const playAlreadyInProgess = Boolean(Room.game.play);

    // Check if they can even run the command
    if (playAlreadyInProgess)
      return {
        valid: false,
        message: "There is already a play in progress",
        sendToPlayer: true,
      };

    if (!playerIsOnOffense)
      return {
        valid: false,
        message: "You are not on offense",
        sendToPlayer: true,
      };

    // Check for penalties

    const {
      valid,
      penaltyName,
      player: penaltiedPlayer,
      penaltyData,
    } = new SnapValidator(player).validate();

    if (valid)
      return {
        valid: true,
      };

    // Otherwise lets handle the penalty

    this._handlePenalty(penaltyName!, penaltiedPlayer!, penaltyData);

    // Dont send a penalty message to the player, since we are sending it globally already
    return {
      valid: false,
      sendToPlayer: false,
    };
  }

  run() {
    Room.game.updateStaticPlayers();
    this.setBallPositionOnSet(Ball.getPosition());
    this._startBlitzClock();
    this._setLivePlay(true);
    Ball.release();
    this.setState("ballSnapped");
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

    Chat.send(`Ball went out of bounds!`);
    return this.endPlay({});
  }
  handleBallCarrierOutOfBounds(ballCarrierPosition: Position) {
    if (this.stateExists("interceptionAttempt"))
      return this._handleInterceptionBallCarrierOutOfBounds(
        ballCarrierPosition
      );
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

    Chat.send("Illegal Run");

    this.endPlay({});

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

    const {
      player: { team },
    } = ballContactObj;

    return team === Room.game.offenseTeamId
      ? this._handleBallContactOffense(ballContactObj)
      : this._handleBallContactDefense(ballContactObj);
  }
}
