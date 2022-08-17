import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { PlayerObject, PlayerObjFlat, Position } from "../../HBClient";
import Ball from "../../roomStructures/Ball";
import Chat from "../../roomStructures/Chat";
import Room from "../../roomStructures/Room";
import { DistanceConverter } from "../../structures/DistanceCalculator";
import GameReferee from "../../structures/GameReferee";
import MapReferee from "../../structures/MapReferee";
import MessageFormatter from "../../structures/MessageFormatter";
import PreSetCalculators from "../../structures/PreSetCalculators";
import ICONS from "../../utils/Icons";
import BasePlay, { EndPlayData } from "../BasePlay";

export interface PuntStore {
  punt: true;
  puntCaught: true;
  puntKicked: true;
  puntKicker: PlayerObjFlat;
}

export default abstract class PuntEvents extends BasePlay<PuntStore> {
  protected abstract _checkIfOffenseOffsidesOnKick(player: PlayerObjFlat): {
    isOffsides: boolean;
    offsidesPlayer: PlayerObject | null;
  };
  protected abstract _handleOffensePenalty(
    player: PlayerObjFlat,
    penaltyName: "puntOffsidesOffense" | "puntDrag"
  ): void;
  protected abstract _handleCatch(ballContactObj: BallContact): void;
  protected abstract _releaseInvisibleWallForDefense(): void;
  protected abstract _endPlayAndSetNewDown(
    endPlayData: Omit<EndPlayData, "setNewDown">
  ): void;
  protected abstract _getFromYardAndHalfStr(): string;

  onBallContact(ballContactObj: BallContact) {
    // We have to do this check AGAIN because playerOnkick is not an event listener, but a native listener
    if (this.stateExists("puntCaught")) return;
    super.onBallContact(ballContactObj);
  }

  onBallOutOfBounds(ballPosition: Position) {
    const adjustedBallPositionForTeam =
      PreSetCalculators.adjustBallPositionOnOutOfBounds(
        ballPosition,
        Room.game.offenseTeamId
      );

    const ballPositionYardLine = DistanceConverter.toYardLine(
      adjustedBallPositionForTeam.x
    );

    const ballPositionYardLineStr = MessageFormatter.formatYardAndHalfStr(
      ballPositionYardLine,
      adjustedBallPositionForTeam.x
    );

    Chat.send(
      `${ICONS.Pushpin} Ball went out of bounds ${ballPositionYardLineStr}`
    );

    // Check if touchback, mathematically can't be a safety since the ball cant travel from one endzone to the other
    const isTouchback = GameReferee.checkIfTouchbackBall(
      ballPosition,
      Room.game.offenseTeamId
    );
    if (isTouchback) return this._handleTouchback();

    // Otherwise just set the endPosition as the distance
    this._endPlayAndSetNewDown({ newLosX: adjustedBallPositionForTeam.x });
  }

  onBallCarrierOutOfBounds(ballCarrierPosition: Position) {
    const { endPosition, yardAndHalfStr, netYards, netYardsStr, isTouchdown } =
      this._getPlayDataOffense(ballCarrierPosition);

    if (isTouchdown) return this.handleTouchdown(ballCarrierPosition);

    Chat.send(
      `${
        this.getBallCarrier().name
      } went out of bounds ${yardAndHalfStr} | ${netYardsStr}`
    );

    Room.game.stats.updatePlayerStat(this._ballCarrier!.id, {
      specReceptions: 1,
      specReceivingYards: netYards,
    });

    const { isSafety, isTouchback } =
      GameReferee.checkIfSafetyOrTouchbackPlayer(
        this._startingPosition,
        endPosition,
        Room.game.offenseTeamId
      );

    if (isSafety) return super._handleSafety();
    if (isTouchback) return super._handleTouchback();

    this._endPlayAndSetNewDown({ newLosX: endPosition.x });
  }
  onBallCarrierContactOffense(playerContact: PlayerContact) {
    // Nothing happens, runs cannot occur
  }
  onBallCarrierContactDefense(playerContact: PlayerContact) {
    const { endPosition, netYards, yardAndHalfStr, netYardsStr } =
      this._getPlayDataOffense(playerContact.ballCarrierPosition);

    Chat.send(
      `${ICONS.HandFingersSpread} Tackle ${yardAndHalfStr} | ${netYardsStr}`
    );

    Room.game.stats.updatePlayerStat(this._ballCarrier!.id, {
      specReceptions: 1,
      specReceivingYards: netYards,
    });

    Room.game.stats.updatePlayerStat(playerContact.player.id, {
      specTackles: 1,
    });

    const { isSafety, isTouchback } =
      GameReferee.checkIfSafetyOrTouchbackPlayer(
        this._startingPosition,
        endPosition,
        Room.game.offenseTeamId
      );

    if (isSafety) return super._handleSafety();
    if (isTouchback) return super._handleTouchback();

    this._endPlayAndSetNewDown({
      newLosX: endPosition.x,
      netYards,
    });
  }
  onKickDrag(player: PlayerObjFlat | null): void {
    const fieldedPlayers = Room.game.players.getFielded();

    // We have to get the closest player to the ball to determine the kicker, since it could be anyone
    const { player: playerClosestToBall } =
      MapReferee.getNearestPlayerToPosition(
        fieldedPlayers,
        Ball.getPosition()
      )!;
    this._handleOffensePenalty(playerClosestToBall, "puntDrag");
  }

  protected _onBallContactOffense(ballContactObj: BallContact): void {
    // We have to know if it was kicked off first
    // Kicking team starts off as offense, switched to defense moment the ball is kicked

    const { player } = ballContactObj;

    // Kicking team touches
    if (this.stateExists("puntKicked") === false) {
      if (ballContactObj.type === "kick") {
        this.setState("puntKicked");
        this.setState("puntKicker", player);
        this._releaseInvisibleWallForDefense();
        Room.game.swapOffenseAndUpdatePlayers();

        // Before we swap, check for the penalty
        const { isOffsides, offsidesPlayer } =
          this._checkIfOffenseOffsidesOnKick(player);

        if (isOffsides)
          return this._handleOffensePenalty(
            offsidesPlayer!,
            "puntOffsidesOffense"
          );
      }

      return;
    }

    // Receiving team touches
    this._handleCatch(ballContactObj);
  }

  protected _onBallContactDefense(ballContactObj: BallContact): void {
    const { yardAndHalfStr, endPosition } = this._getPlayDataOffense(
      ballContactObj.playerPosition
    );

    // Ball downed by own team
    Chat.send(`${ICONS.Pushpin} Ball downed by defense ${yardAndHalfStr}`);

    // Check where the ball was downed at
    // The catch position is the same as the endzone position
    // Adjust it for defense, since they are the ones making contact
    const { isTouchback } = GameReferee.checkIfSafetyOrTouchbackPlayer(
      this._startingPosition,
      endPosition,
      Room.game.offenseTeamId
    );

    if (isTouchback) return this._handleTouchback();

    this._endPlayAndSetNewDown({ newLosX: endPosition.x });
  }
}
