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
import { flattenPlayer, quickPause } from "../utils/haxUtils";
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
  protected _ballPositionOnSet: Position | null = null;
  protected _startingPosition: Position;
  time: number;

  constructor(time: number) {
    super();
    this.time = Math.round(time);
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

  terminatePlayDuringError() {
    this._setLivePlay(false);
  }

  getMaskPlay<T extends PLAY_TYPES>() {
    return this as unknown as T;
  }

  /**
   * Sets the starting position to determine net yards
   */
  protected _setStartingPosition(position: Position) {
    this._startingPosition = position;
  }

  /**
   * Returns the saved position of the ball before the play began
   */
  getBallPositionOnSet() {
    return this._ballPositionOnSet;
  }

  /**
   * Saves the position of the ball before the play begins
   */
  setBallPositionOnSet(position: Position) {
    this._ballPositionOnSet = position;
    return this;
  }

  /**
   * Moves the field markers in place and the ball
   */
  positionBallAndFieldMarkers() {
    Ball.setPosition(Room.game.down.getSnapPosition());
    Room.game.down.moveFieldMarkers();
    return this;
  }

  /**
   * Scores the ball in one of two endzones, and updates a team's score by an amount
   * @param teamEndZoneToScore The endzone to score the ball in, red is left, blue is right
   */
  scorePlay(
    score: number,
    team: PlayableTeamId,
    teamEndZoneToScore: PlayableTeamId
  ) {
    this._setLivePlay(false);

    Room.game.addScore(team, score);
    Ball.score(teamEndZoneToScore);
    Room.game.sendScoreBoard();
    Room.game.down.resetAfterScore();

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

  /**
   * Handles a safety
   */
  handleSafety() {
    this._setLivePlay(false);
    Chat.send("SAFETY!!!");

    Room.game.setState("safetyKickoff");

    // ? Why is offense scoring? Because we need the defense to get the ball, so offense has to kickoff
    this.scorePlay(2, Room.game.defenseTeamId, Room.game.offenseTeamId);
  }

  /**
   * Handles the penalty and ends the down
   */
  protected _handlePenalty<T extends PenaltyName>(
    penaltyName: T,
    player: PlayerObjFlat,
    penaltyData: AdditionalPenaltyData = {}
  ) {
    quickPause();

    const losX = Room.game.down.getLOS().x;

    const isInDefenseRedzone =
      MapReferee.checkIfInRedzone(losX) === Room.game.defenseTeamId;

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
        return this.getMaskPlay<Snap>().handleAutoTouchdown();
    }

    this.endPlay({ addDown, newLosX: newEndLosX, netYards: penaltyYards });
  }

  /**
   * Ends the play and handles updating the down and moving the LOS
   */
  endPlay({
    netYards = 0,
    newLosX = null,
    addDown = true,
    resetDown = false,
  }: EndPlayData) {
    const updateDown = () => {
      // Dont update the down if nothing happened, like off a pass deflection, punt, or kickoff
      if (newLosX === null) return;

      const addYardsAndStartNewDownIfNecessary = () => {
        Room.game.down.setLOS(newLosX);
        Room.game.down.subtractYards(netYards);

        const currentYardsToGet = Room.game.down.getYards();

        // First down
        if (currentYardsToGet <= 0 || resetDown) {
          if (resetDown === false) {
            Chat.send("FIRST DOWN!");
          }
          Room.game.down.startNew();
        }

        // Maybe instead of doing this, u can just add anb option to EndPlayData like "turnover"
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

  /**
   * Handles a player touching the ball
   */
  handleBallContact(ballContactObj: BallContact) {
    return ballContactObj.player.team === Room.game.offenseTeamId
      ? this._handleBallContactOffense(ballContactObj)
      : this._handleBallContactDefense(ballContactObj);
  }

  /* ABSTRACT */

  /**
   * Validation before the game sets the play
   * @return Throws a GameCommandError in the case of an error
   */
  abstract validateBeforePlayBegins(player: PlayerObject | null): void;

  /**
   * Prepares aspects such as player and ball position before the play is run
   */
  abstract prepare(): void;

  /**
   * Begins live play
   */
  abstract run(): void;

  /**
   * Handled ball out of bounds
   */
  abstract handleBallOutOfBounds(ballPosition: Position): void;

  /**
   * Handled ball carrier out of bounds
   */
  abstract handleBallCarrierOutOfBounds(ballCarrierPosition: Position): void;

  /**
   * Handled offense touching ball carrier (runs)
   */
  abstract handleBallCarrierContactOffense(playerContact: PlayerContact): void;

  /**
   * Handled defense touching ball carrier (tackles)
   */
  abstract handleBallCarrierContactDefense(playerContact: PlayerContact): void;

  /**
   * Handles an offensive player touching the ball
   */
  protected abstract _handleBallContactOffense(
    ballContactObj: BallContact
  ): void;

  /**
   * Handles a defensive player touching the ball
   */
  protected abstract _handleBallContactDefense(
    ballContactObj: BallContact
  ): void;

  /**
   * Handles a player scoring a touchdown
   */
  abstract handleTouchdown(position: Position): void;

  /**
   * Handles a drag on a kick
   */
  abstract onKickDrag(player: PlayerObjFlat | null): void;

  /**
   * Cleans up any variables from the current play
   */
  abstract cleanUp(): void;
}
