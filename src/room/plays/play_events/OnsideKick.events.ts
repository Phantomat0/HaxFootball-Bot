import Room from "../..";
import BallContact from "../../classes/BallContact";
import PlayerContact from "../../classes/PlayerContact";
import { PlayerObjFlat, Position } from "../../HBClient";
import Chat from "../../roomStructures/Chat";
import GameReferee from "../../structures/GameReferee";
import ICONS from "../../utils/Icons";
import BasePlay from "../BasePlay";

export interface OnsideKickStore {
  onsideKick: true;
  onsideKickKicked: true;
  onsideKickCaught: true;
}

export default abstract class OnsideKickEvents extends BasePlay<OnsideKickStore> {
  protected abstract _kicker: PlayerObjFlat;
  protected abstract _handleBallContactKicker(
    ballContactObj: BallContact
  ): void;
  protected abstract _handleUnsuccessfulOnsideKick(msg: string | null): void;
  protected abstract _handleCatch(ballContactObj: BallContact): void;
  onBallCarrierContactOffense(playerContact: PlayerContact): void {
    // Nothing interesting happens since we dont allow runs on kickoff
  }

  onBallCarrierContactDefense(playerContact: PlayerContact): void {
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

    // Cant be a touchback, since its impossible to catch in endzone
    const { isSafety } = GameReferee.checkIfSafetyOrTouchbackPlayer(
      this._startingPosition,
      endPosition,
      Room.game.offenseTeamId
    );

    if (isSafety) return super.handleSafety();

    this.endPlay({
      newLosX: endPosition.x,
      netYards,
    });
  }

  onBallCarrierOutOfBounds(ballCarrierPosition: Position): void {
    if (this.stateExists("onsideKickKicked") === false) {
      return this._handleUnsuccessfulOnsideKick("Kicker went out of bounds");
    }
    const { endPosition, yardAndHalfStr, netYards, netYardsStr } =
      this._getPlayDataOffense(ballCarrierPosition);

    Chat.send(
      `${
        this.getBallCarrier().name
      } went out of bounds ${yardAndHalfStr} | ${netYardsStr}`
    );

    Room.game.stats.updatePlayerStat(this._ballCarrier!.id, {
      specReceptions: 1,
      specReceivingYards: netYards,
    });

    // Cant be a touchback, since its impossible to catch in endzone
    const { isSafety } = GameReferee.checkIfSafetyOrTouchbackPlayer(
      this._startingPosition,
      endPosition,
      Room.game.offenseTeamId
    );

    if (isSafety) return super.handleSafety();

    this.endPlay({ newLosX: endPosition.x });
  }

  onBallContact(ballContactObj: BallContact): void {
    if (this.stateExists("onsideKickCaught")) return;
    super.onBallContact(ballContactObj);
  }

  onBallOutOfBounds(ballPosition: Position): void {
    this._handleUnsuccessfulOnsideKick("Kick went out of bounds");
  }

  onKickDrag(player: PlayerObjFlat | null): void {
    this._handlePenalty("onsideKickDrag", this._kicker);
    this._handleUnsuccessfulOnsideKick(null);
  }

  protected _onBallContactDefense(ballContactObj: BallContact): void {
    // Only way defense can touch is if ts downed by own team or kicker touches
    if (ballContactObj.player.id === this._kicker.id)
      return this._handleBallContactKicker(ballContactObj);

    // Otherwise, its illegally touched
    return this._handleUnsuccessfulOnsideKick(
      "Illegaly touched by kicking team"
    );
  }

  protected _onBallContactOffense(ballContactObj: BallContact): void {
    if (ballContactObj.player.id === this._kicker.id)
      return this._handleBallContactKicker(ballContactObj);

    // If offense touches, thats not kicker, before the kick, its the kicking team's 40, and swap offense
    if (this.stateExists("onsideKickKicked") === false) {
      return this._handleUnsuccessfulOnsideKick(
        "Illegaly touched by kicking team"
      );
    }

    // Now we know the receiving team touches
    this._handleCatch(ballContactObj);
  }
}
