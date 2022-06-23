import BallContact from "../classes/BallContact";
import { PlayableTeamId, PlayerObjFlat, Position } from "../HBClient";
import { SHOW_DEBUG_CHAT } from "../roomConfig";
import Chat from "../roomStructures/Chat";
import Ball from "../roomStructures/Ball";
import MapReferee from "../structures/MapReferee";
import MessageFormatter from "../structures/MessageFormatter";
import PenaltyDataGetter, {
  AdditionalPenaltyData,
} from "../structures/PenaltyDataGetter";
import { PenaltyName } from "../structures/PenaltyDataGetter";
import PreSetCalculators from "../structures/PreSetCalculators";
import { flattenPlayer, quickPause } from "../utils/haxUtils";
import ICONS from "../utils/Icons";
import MapSectionFinder, { MapSectionName } from "../utils/MapSectionFinder";
import { addPlus, plural, truncateName } from "../utils/utils";
import Snap from "./Snap";
import BasePlayAbstract, { PLAY_TYPES } from "./BasePlayAbstract";
import DistanceCalculator from "../structures/DistanceCalculator";
import PlayerContact from "../classes/PlayerContact";
import Room from "../roomStructures/Room";
import client from "..";

export interface EndPlayData {
  /**
   * Used to update the down and distance
   */
  netYards?: number;
  /**
   * Where the LOS will be for the next play.
   *
   * Can be null if the LOS isn't moving
   */
  newLosX?: Position["x"] | null;
  /**
   * Used exclusively in penalties when we want to repeat a down
   */
  addDown?: boolean;
  /**
   * Used when we want to force a new down
   */
  setNewDown?: boolean;
}

export default abstract class BasePlay<T> extends BasePlayAbstract<T> {
  /**
   * Starts play and fires event listeners
   */
  protected _isLivePlay: boolean = false;
  /**
   * The current play with possession of the ball, can be null
   */
  protected _ballCarrier: ReturnType<typeof flattenPlayer> | null = null;
  /**
   * The starting position of the ball
   */
  protected _ballPositionOnSet: Position | null = null;

  /**
   * The starting position to determine net yards
   */
  protected _startingPosition: Position;

  /**
   * The game time the play began
   */
  time: number;

  /**
   * Max drag distance for the onKickDrag method to fire
   */
  MAX_DRAG_DISTANCE: number = 15;

  constructor(time: number) {
    super();
    this.time = Math.round(time);
  }

  /**
   *
   * Sets the ball carrier, and sets their avatar
   */
  setBallCarrier(player: ReturnType<typeof flattenPlayer> | null) {
    // Remove the ball avatar of the old ball carrier, if it exists
    if (player === null && this._ballCarrier) {
      client.setPlayerAvatar(this._ballCarrier.id, null);
    }
    this._ballCarrier = player;
    if (player) client.setPlayerAvatar(player.id, ICONS.Football);
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

  terminatePlayDuringError() {
    this._setLivePlay(false);
  }

  getMaskPlay<T extends PLAY_TYPES>() {
    return this as unknown as T;
  }

  resetPlayerPhysicsAndRemoveTightEnd() {
    Room.game.setTightEnd(null);
  }

  /**
   * Sets the game state allowing the two point command to be ran
   */
  allowForTwoPointAttempt() {
    // Allow for a two point attempt
    Room.game.setState("canTwoPoint");
  }

  /**
   * Sends the touchdown announcement, scores the play, and sets "canTwoPoint"
   * @param endPosition
   */
  handleTouchdown(endPosition: Position) {
    this._setLivePlay(false);

    const { netYards } = this._getPlayDataOffense(endPosition);

    const truncatedBallCarrierName = truncateName(this._ballCarrier!.name);
    Chat.send(
      `${ICONS.Fire} TOUCHDOWN ${truncatedBallCarrierName} ${plural(
        netYards,
        "yard",
        "yards"
      )}`,
      { sound: 2 }
    );

    this.scorePlay(7, Room.game.offenseTeamId, Room.game.defenseTeamId);

    this.allowForTwoPointAttempt();
  }

  handleDefenseLineBlitz() {}

  protected _checkForFumble(playerContact: PlayerContact) {
    if (this.stateExistsUnsafe("twoPointAttempt")) return false;

    // We want a max speed just incase the player is moving fast
    // because he got hit with the ball, it will mess with our
    // speed
    const MAX_SPEED = 2.5;

    // A fumble is

    const MIN_SUM_SPEED_FOR_FUMBLE = 3.8;

    const { playerSpeed, ballCarrierSpeed } = playerContact;

    // Adjusts the speeds, since we can have negative speeds
    const playerXSpeed = Math.min(Math.abs(playerSpeed.x), MAX_SPEED);
    const playerYSpeed = Math.min(Math.abs(playerSpeed.y), MAX_SPEED);

    const ballCarrierXSpeed = Math.min(Math.abs(ballCarrierSpeed.x), MAX_SPEED);
    const ballCarrierYSpeed = Math.min(Math.abs(ballCarrierSpeed.y), MAX_SPEED);

    Chat.send(`X: ${playerXSpeed.toFixed(3)}`, {
      id: Room.getPlayerTestingId(),
    });

    Chat.send(`Total: ${(playerXSpeed + ballCarrierXSpeed).toFixed(3)}`, {
      id: Room.getPlayerTestingId(),
    });

    const sumSpeed = playerXSpeed + ballCarrierXSpeed;

    if (sumSpeed >= MIN_SUM_SPEED_FOR_FUMBLE) return true;

    return false;
  }

  protected _handleFumble(
    playerContact: PlayerContact,
    ballCarrier: PlayerObjFlat
  ) {
    Chat.send(`Would have been a fumble`, {
      id: Room.getPlayerTestingId(),
      sound: 2,
      icon: ICONS.Dizzy,
    });
    // const { player } = playerContact;
    // // Announce it
    // Chat.send(`${ICONS.Dizzy} Fumble! Recovered by ${player.name}`, {
    //   sound: 2,
    // });

    // // Update stats
    // Room.game.stats.updatePlayerStat(player.id, { forcedFumbles: 1 });
    // Room.game.stats.updatePlayerStat(ballCarrier.id, { fumbles: 1 });

    // // Swap offense
    // Room.game.swapOffenseAndUpdatePlayers();

    // // Check for a touchback or a safety

    // //End the play if neither
    // this.endPlay({ setNewDown: true });
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
  protected _getPlayDataOffense(rawEndPosition: Position): {
    netYards: number;
    endYardLine: number;
    endPosition: Position;
    mapSection: MapSectionName;
    yardsAfterCatch: number;
    yardsPassed: number;
    netYardsStr: string;
    yardAndHalfStr: string;
    isTouchdown: boolean;
  } {
    console.log(rawEndPosition);
    const { yardLine, netYards, adjustedEndPositionX } =
      PreSetCalculators.getNetYardsAndAdjustedEndPosition(
        this._startingPosition,
        rawEndPosition,
        Room.game.offenseTeamId
      );

    const yardsAfterCatch = this.stateExistsUnsafe("catchPosition")
      ? new DistanceCalculator()
          .calcNetDifferenceByTeam(
            (this as unknown as Snap).getState("catchPosition").x,
            adjustedEndPositionX,
            Room.game.offenseTeamId
          )
          .calculateAndConvert().yards
      : 0;

    const yardsPassed = this.stateExistsUnsafe("catchPosition")
      ? new DistanceCalculator()
          .calcNetDifferenceByTeam(
            Room.game.down.getLOS().x,
            (this as unknown as Snap).getState("catchPosition").x,
            Room.game.offenseTeamId
          )
          .calculateAndConvert().yards
      : 0;

    const netYardsStr = addPlus(netYards);

    const yardAndHalfStr = MessageFormatter.formatYardMessage(
      yardLine,
      adjustedEndPositionX
    );

    const losX = Room.game.down.getLOS().x;

    // We dont need to do any adjustmnents for map sections
    const mapSection = new MapSectionFinder().getSectionName(
      rawEndPosition,
      losX,
      Room.game.offenseTeamId
    );

    const endPosition = { x: adjustedEndPositionX, y: rawEndPosition.y };

    const endZonePlayerIsIn = MapReferee.getEndZonePositionIsIn(endPosition);

    const isTouchdown =
      Boolean(endZonePlayerIsIn) &&
      endZonePlayerIsIn !== Room.game.offenseTeamId;

    return {
      netYards,
      endYardLine: yardLine,
      endPosition,
      mapSection,
      yardsAfterCatch,
      yardsPassed,
      netYardsStr,
      yardAndHalfStr,
      isTouchdown,
    };
  }

  /**
   * Handles a safety
   */
  _handleSafety() {
    this._setLivePlay(false);
    Chat.send(`${ICONS.Loudspeaker} Safety - kickoff from the 20 yard line`);

    Room.game.setState("safetyKickoff");

    // ? Why is the defense scoring? Because we need the defense to get the ball, so offense has to kickoff
    this.scorePlay(2, Room.game.defenseTeamId, Room.game.defenseTeamId);
  }

  /**
   * Handles a touchback, only callable on punts or kickoffs
   */
  protected _handleTouchback() {
    Chat.send(
      `${ICONS.Loudspeaker} Touchback - ball placed at the receiving team's 20 yard line.`
    );

    const offenseTwentyYardLine = PreSetCalculators.getPositionOfTeamYard(
      20,
      Room.game.offenseTeamId
    );

    this.endPlay({ newLosX: offenseTwentyYardLine, setNewDown: true });
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
    setNewDown = false,
  }: EndPlayData) {
    this._setLivePlay(false);

    const gotFirstDown = this._updateDistance({
      netYards,
      newLosX,
      addDown,
      setNewDown,
    });

    // Set the new LOS position if it is present
    if (newLosX !== null) Room.game.down.setLOS(newLosX);

    this._updateDown(gotFirstDown, { netYards, newLosX, addDown, setNewDown });
    Room.game.down.resetAfterDown();
  }

  /**
   * Handles a player touching the ball
   */
  onBallContact(ballContactObj: BallContact) {
    return ballContactObj.player.team === Room.game.offenseTeamId
      ? this._onBallContactOffense(ballContactObj)
      : this._onBallContactDefense(ballContactObj);
  }

  protected _setLivePlay(bool: boolean) {
    this._isLivePlay = bool;
    if (SHOW_DEBUG_CHAT) {
      Chat.send(`SET LIVE PLAY TO: ${bool}`);
    }
  }

  /**
   * Updates the the LOS distance
   * @returns gotFirstDown Returns true if the offense got a first down
   *
   * Returns false if resetDown is true
   */
  private _updateDistance({ netYards, newLosX }: Required<EndPlayData>) {
    // If the line of scrimmage isn't being moved, we dont have have to update the distance
    if (newLosX === null) return false;

    // \
    const currentYardsToGet = Room.game.down.getYardsToGet();

    // We gained the same or more yards than we needed, first down
    if (netYards >= currentYardsToGet) return true;

    // Otherwise we have to subtract the yards
    Room.game.down.subtractYardsToGet(netYards);

    return false;
  }

  /**
   * Enforces a turnover on 5th down on a bad fg/ bad fg rush
   *
   * Resets the down if resetDown set to true, and starts a new down if we got a first down
   */
  private _updateDown(
    gotFirstDown: boolean,
    { addDown, setNewDown }: Required<EndPlayData>
  ) {
    if (setNewDown) return Room.game.down.startNew();
    // If they got the first down, send message and start a new down
    if (gotFirstDown) {
      // Chat.send(`${ICONS.Star} First Down!`);
      return Room.game.down.startNew();
    }

    // If they didn't get a first down, add the down and check for a possible turnover
    if (addDown) {
      Room.game.down.addDown();
    }

    const TURNOVER_DOWN = 5;

    const currentDown = Room.game.down.getDown();

    const isFieldGoal = this.stateExistsUnsafe("fieldGoal");

    // Check for turnover, either they reach the turnover down
    // or they didn't get a first down on a field goal
    if (currentDown === TURNOVER_DOWN || isFieldGoal) {
      Chat.send(`${ICONS.Loudspeaker} Turnover on downs!`, { sound: 0 });
      Room.game.swapOffenseAndUpdatePlayers();
      Room.game.down.startNew();
    }
  }
}
