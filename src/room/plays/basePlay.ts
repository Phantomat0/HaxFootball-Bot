import Room from "..";
import BallContact from "../classes/BallContact";
import PlayerContact from "../classes/PlayerContact";
import WithStateStore from "../classes/WithStateStore";
import {
  PlayableTeamId,
  PlayerObject,
  PlayerObjFlat,
  Position,
} from "../HBClient";
import Chat from "../roomStructures/Chat";
import Ball from "../structures/Ball";
import DistanceCalculator from "../structures/DistanceCalculator";
import MapReferee from "../structures/MapReferee";
import PenaltyDataGetter, {
  AdditionalPenaltyData,
} from "../structures/PenaltyDataGetter";
import { PenaltyName } from "../structures/PenaltyDataGetter";
import PreSetCalculators from "../structures/PreSetCalculators";
import { flattenPlayer } from "../utils/haxUtils";
import ICONS from "../utils/Icons";
import MapSectionFinder from "../utils/MapSectionFinder";
import FieldGoal from "./FieldGoal";
import KickOff from "./Kickoff";
import { FieldGoalStore } from "./play_events/FieldGoal.events";
import { KickOffStore } from "./play_events/KickOff.events";
import { PuntStore } from "./play_events/Punt.events";
import { SnapStore } from "./play_events/Snap.events";
import Punt from "./Punt";
import Snap from "./Snap";

export type PLAY_TYPES = Snap | FieldGoal | KickOff | Punt;

type PlayStorages = SnapStore & FieldGoalStore & PuntStore & KickOffStore;

export type PlayStorageKeys = keyof PlayStorages | "twoPointAttempt";

interface EndPlayData {
  netYards?: number;
  newLosX?: Position["x"] | null;
  addDown?: boolean;
  resetDown?: boolean;
}

export default abstract class BasePlay<T> extends WithStateStore<
  T,
  PlayStorageKeys
> {
  protected _isLivePlay: boolean = false;
  protected _ballCarrier: ReturnType<typeof flattenPlayer> | null = null;
  protected _ballPositionOnSet: Position;
  protected _startingPosition: Position;
  time: number;

  constructor(time: number) {
    super();
    this.time = Math.round(time);
    this._startingPosition = Room.game.down.getLOS();
  }

  setBallCarrier(player: ReturnType<typeof flattenPlayer> | null) {
    this._ballCarrier = player;
    return this;
  }

  getBallCarrier() {
    if (!this._ballCarrier)
      throw Error("Game Error: Ball Carrier could not be found");
    return this._ballCarrier;
  }

  getBallCarrierSafe() {
    return this._ballCarrier;
  }

  get isLivePlay() {
    return this._isLivePlay;
  }

  protected _setLivePlay(bool: boolean) {
    Chat.send(`SET LIVE PLAY TO: ${bool}`);
    this._isLivePlay = bool;
  }

  getMaskPlay<T extends PLAY_TYPES>() {
    return this as unknown as T;
  }

  getBallPositionOnSet() {
    return this._ballPositionOnSet;
  }

  setBallPositionOnSet(position: Position) {
    this._ballPositionOnSet = position;
    return this;
  }

  positionBallAndFieldMarkers() {
    Ball.setPosition(Room.game.down.getSnapPosition());
    Room.game.down.moveFieldMarkers();
    return this;
  }

  scorePlay(
    score: number,
    team: PlayableTeamId,
    teamEndZoneToScore: PlayableTeamId
  ) {
    this._setLivePlay(false);

    Room.game.addScore(team, score);
    Ball.score(teamEndZoneToScore);
    Room.game.sendScoreBoard();

    // Dont swap offense, we swap offense on the kickoff
  }

  /**
   * Returns information about the play when the offense made a play i.e catch, run, qb run etc
   */
  protected _getPlayDataOffense(rawEndPosition: Position) {
    const offenseTeam = Room.game.offenseTeamId;
    // Adjust the rawPlayerPosition
    const newEndPosition = PreSetCalculators.adjustPlayerPositionFrontAfterPlay(
      rawEndPosition,
      offenseTeam
    );

    const losX = Room.game.down.getLOS().x;
    const mapSection = new MapSectionFinder().getSectionName(
      newEndPosition,
      losX
    );

    // Calculate data with it
    const { yardLine: endYard, yards: netYards } = new DistanceCalculator()
      .calcNetDifferenceByTeam(
        this._startingPosition.x,
        newEndPosition.x,
        offenseTeam
      )
      .roundToYardByTeam(offenseTeam)
      .calculateAndConvert();

    return {
      netYards,
      endYard,
      endPosition: newEndPosition,
      mapSection,
    };
  }

  handleSafety() {
    this._setLivePlay(false);
    Chat.send("SAFETY!!!");
    Ball.score(Room.game.defenseTeamId);

    // const offenseEndZone = MapReferee.getTeamEndzone(Room.game.offenseTeamId);
    // const offenseTwentyYardLine = new DistanceCalculator()
    //   .addByTeam(offenseEndZone, MAP_POINTS.YARD * 20, Room.game.offenseTeamId)
    //   .calculate();

    // Room.game.setState("kickOffPosition", offenseTwentyYardLine);

    // // ? Why is offense scoring? Because we need the defense to get the ball, so offense has to kickoff
    // this.scorePlay(2, game.getDefenseTeam(), game.getOffenseTeam());

    // // Score the play first, so we can create a new down
    // down.setState("safetyKickOff", offenseTwentyYardLine);
  }

  protected _handlePenalty<T extends PenaltyName>(
    penaltyName: T,
    player: PlayerObjFlat,
    penaltyData: AdditionalPenaltyData = {}
  ) {
    const losX = Room.game.down.getLOS().x;

    const isInDefenseRedzone =
      MapReferee.checkIfInRedzone(losX) === Room.game.defenseTeamId;

    console.log({ isInDefenseRedzone });

    const {
      penaltyYards,
      addDown,
      hasOwnHandler,
      isRedZonePenaltyOnDefense,
      newEndLosX,
      penaltyMessage,
    } = new PenaltyDataGetter().getData(
      penaltyName,
      player,
      isInDefenseRedzone,
      losX,
      Room.game.offenseTeamId,
      penaltyData
    );

    // Lets send the penalty!
    Chat.send(`${ICONS.YellowSquare} ${penaltyMessage}`);

    // Add the penalty stat and yards to the player's stats

    Room.game.stats.updatePlayerStat(player.id, {
      penalties: 1,
    });

    if (hasOwnHandler) return;

    if (isRedZonePenaltyOnDefense) {
      Room.game.down.incrementRedZonePenalties();

      const isAutoTouchdown = Room.game.down.hasReachedMaxRedzonePenalties();

      if (isAutoTouchdown)
        return this.getMaskPlay<Snap>()._handleAutoTouchdown();
    }

    this.endPlay({ addDown, newLosX: newEndLosX, netYards: penaltyYards });
  }

  endPlay({
    netYards = 0,
    newLosX = null,
    addDown = true,
    resetDown = false,
  }: EndPlayData) {
    console.log(netYards, newLosX, addDown);

    // const isKickOffOrPunt = this.getState("punt") || this.getState("kickOff");
    const updateDown = () => {
      console.log("UPDATE DOWN RAN");
      // Dont update the down if nothing happened, like off a pass deflection, punt, or kickoff
      if (newLosX === null) return;

      const addYardsAndStartNewDownIfNecessary = () => {
        Room.game.down.setLOS(newLosX);
        Room.game.down.subtractYards(netYards);

        const currentYardsToGet = Room.game.down.getYards();

        // First down
        if (currentYardsToGet <= 0 || resetDown) {
          Chat.send("FIRST DOWN!");
          Room.game.down.startNew();
        }

        // Turnover
        if (this.stateExistsUnsafe("fieldGoal")) {
          // This endplay only runs when there is a running play on the field goal
          Chat.send(`${ICONS.Loudspeaker} Turnover on downs FIELD GOAL!`);
          Room.game.swapOffenseAndUpdatePlayers();
          Room.game.down.startNew();
        }
      };
      addYardsAndStartNewDownIfNecessary();
    };
    const enforceDown = () => {
      const currentDown = Room.game.down.getDown();

      // Check for turnover
      if (currentDown === 5) {
        Chat.send(`${ICONS.Loudspeaker} Turnover on downs!`);
        Room.game.swapOffenseAndUpdatePlayers();
        Room.game.down.startNew();
      }
    };

    this._setLivePlay(false);

    if (addDown && resetDown === false) {
      Room.game.down.addDown();
    }

    updateDown();
    enforceDown();
    Room.game.down.resetAfterDown();
  }

  /* ABSTRACT */

  // protected abstract _handleBallContactOffense(
  //   ballContactObj: BallContact
  // ): void;
  // protected abstract _handleBallContactDefense(
  //   ballContactObj: BallContact
  // ): void;

  abstract validateBeforePlayBegins(player: PlayerObject): {
    valid: boolean;
    message?: string;
    sendToPlayer?: boolean;
  };
  abstract run(): void;
  abstract handleBallOutOfBounds(ballPosition: Position): void;
  abstract handleBallCarrierOutOfBounds(ballCarrierPosition: Position): void;
  abstract handleBallCarrierContactOffense(playerContact: PlayerContact): void;
  abstract handleBallCarrierContactDefense(playerContact: PlayerContact): void;
  abstract handleBallContact(ballContactObj: BallContact): void;
  abstract handleTouchdown(position: Position): void;
  abstract onKickDrag(player: PlayerObjFlat): void;
  abstract destroy(): void;
}
