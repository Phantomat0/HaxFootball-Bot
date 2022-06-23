import { ParamType } from "./commands/Commands";
import { onFunctions } from "./utils/helperTypes";

export type HBRecording = string;

type TeamId = 0 | 1 | 2;

type DefaultStadiums =
  | "Classic"
  | "Easy"
  | "Small"
  | "Big"
  | "Rounded"
  | "Hockey"
  | "BigHockey"
  | "BigEasy"
  | "BigRounded"
  | "Huge";

type PlayableTeamId = 1 | 2;

export interface ScoresObject {
  red: number;
  blue: number;
  time: number;
  scoreLimit: number;
  timeLimit: number;
}

interface Position {
  x: number;
  y: number;
}

interface Speed {
  x: number;
  y: number;
}

interface DiscPropertiesObject {
  /**
   * x axis position.
   */
  x: number;
  /**
   * y axis position.
   */
  y: number;
  /**
   * x axis speed, can be negative.
   */
  xspeed: number;
  /**
   * y axis speed, can be negative.
   */
  yspeed: number;
  /**
   * x gravity.
   */
  xgravity: number;
  /**
   * y gravity.
   */
  ygravity: number;
  /**
   * Radius of the disc.
   */
  radius: number;
  /**
   * Number from 0 to 1 that defines how bouncy the ball is.
   */
  bCoeff: number;
  /**
   * Number from 0 to 1 that defines the inverse of the mass, the closer to 0 the heavier this object is.
   */
  invMass: number;
  /**
   * Number from 0 to 1 that defines the inverse of the mass, the closer to 0 the heavier this object is.
   */
  damping: number;
  color: number;
  cMask: number;
  cGroup: number;
}

/* DEFAULT PHYSICS */

// "playerPhysics" : {
// 	"bCoef" : 0.5,
// 	"invMass" : 0.5,
// 	"damping" : 0.96,
// 	"acceleration" : 0.1,
// 	"kickingAcceleration" : 0.07,
// 	"kickingDamping" : 0.96,
// 	"kickStrength" : 5

// },

// "ballPhysics" : {
// 	"radius" : 10,
// 	"bCoef" : 0.5,
// 	"invMass" : 1,
// 	"damping" : 0.99,
// 	"color" : "FFFFFF",
// 	"cMask" : [ "all"
// 	],
// 	"cGroup" : [ "ball"
// 	]

// }

/**
 * Collision flags for map collisions
 */
export interface CollisionFlags {
  /**
   * The default collision group of the ball.
   */
  ball: 1;

  /**
   * The red team collision flag. This layer is automatically added to players of the red team.
   */
  red: 2;

  /**
   * The blue team collision flag. This layer is automatically added to players of the blue team.
   */
  blue: 4;

  /**
   * The red KO collision flag. This layer represents kickoff barriers that become active during kickOff for the red team.
   */
  redKO: 8;

  /**
   * The blue KO collision flag. This layer represents kickoff barriers that become active during kickOff for the blue team.
   */
  blueKO: 16;

  /**
   * The default collision group for vertexes segments and planes.
   */
  wall: 32;

  /**
   * Represents a set including ball, red, blue, redKO, blueKO and wall collision flags.
   */
  all: 63;

  /**
   * The kick collision flag. Objects with this flag in their cGroup will become kickable by the players.
   */
  kick: 64;

  /**
   * The score collision flag.Objects with this flag in their cGroup will score goals if they cross a goal line.
   */
  score: 128;

  c0: 268435456;
  c1: 536870912;
  c2: 1073741824;
  c3: -2147483648;
}

/**
 * The Geo interface.
 */
export interface GeoLocation {
  /**
   * The country code.
   */
  code: string;

  /**
   * The latitude.
   */
  lat: number;

  /**
   * The longitude.
   */
  lon: number;
}

/**
 * HBClientConfig is passed to HBInit to configure the room, all values are optional.
 */
export interface HBClientConfig {
  /**
   * The name for the room.
   */
  roomName?: string;
  /**
   * The name for the host player.
   */
  playerName?: string;
  /**
   * The password for the room (no password if ommited).
   */
  password?: string;
  /**
   * Max number of players the room accepts.
   */
  maxPlayers?: number;
  /**
   * If true the room will appear in the room list.
   */
  public?: boolean;
  /**
   * GeoLocation override for the room.
   */
  geo?: GeoLocation;
  /**
   * Can be used to skip the recaptcha.
   */
  token?: string;
  /**
   * If set to true the room player list will be empty, the playerName setting will be ignored.
   */
  noPlayer?: boolean;
}

/**
 * PlayerObject holds information about a player
 */
export interface PlayerObject {
  /**
   * The id of the player, each player that joins the room gets a unique id that will never change.
   */
  id: number;
  /**
   * The name of the player.
   */
  name: string;
  /**
   * The team of the player.
   */
  team: TeamId;
  /**
   * Whether the player has admin rights.
   */
  admin: boolean;
  /**
   * The player's position in the field, if the player is not in the field the value will be null.
   */
  position: Position;
}

/**
 * Flattened player
 */
export type PlayerObjFlat = Pick<PlayerObject, "name" | "id" | "team">;

/**
 * PlayerObject with connection or auth
 */

interface FullPlayerObject extends PlayerObject {
  /**
   * The player's public ID
   */
  auth: string;
  /**
   * A string that uniquely identifies the player's connection, if two players join using the same network this string will be equal.
   */
  conn: string;
}

export default interface HBClient {
  /**
   * Object filled with the collision flags constants that compose the cMask and cGroup disc properties.
   */
  readonly CollisionFlags: CollisionFlags;
  /**
   * Changes the admin status of the specified player.
   */
  setPlayerAdmin(playerId: PlayerObject["id"], admin: boolean): void;
  /**
   * Kicks the specified player from the room.
   */
  kickPlayer(
    playerId: PlayerObject["id"],
    reason: string | null,
    ban: boolean
  ): void;
  /**
   * Clears the ban for a playerId that belonged to a player that was previously banned.
   */
  clearBan(playerId: PlayerObject["id"]): void;
  /**
   * Clears the list of banned players.
   */
  clearBans(): void;
  /**
   * Sets the score limit of the room.
   */
  setScoreLimit(limit: number): void;
  /**
   * Sets the time limit of the room. The limit must be specified in number of minutes.
   */
  setTimeLimit(limitInMinutes: number): void;
  /**
   * Parses the stadiumFileContents as a .hbs stadium file and sets it as the selected stadium.
   */
  setCustomStadium(stadiumFileContents: string): void;
  /**
   * Sets the selected stadium to one of the default stadiums. The name must match exactly (case sensitive).
   */
  setDefaultStadium(stadiumName: JSON): void;
  /**
   * Sets the teams lock. When teams are locked players are not able to change team unless they are moved by an admin.
   */
  setTeamsLock(locked: boolean): void;
  /**
   * Sets the colors of a team.
   */
  setTeamColors(
    team: number,
    angle: number,
    textColor: number,
    colors: number[]
  ): void;
  /**
   * Moves the specified player to a team
   */
  setPlayerTeam(playerId: PlayerObject["id"], teamId: TeamId): void;
  /**
   * Starts the game, if a game is already in progress this method does nothing.
   */
  startGame(): void;
  /**
   * Stops the game, if no game is in progress this method does nothing
   */
  stopGame(): void;
  /**
   * Sets the pause state of the game. true = paused and false = unpaused
   */
  pauseGame(pauseState: boolean): void;
  /**
   * Returns the player with the specified id. Returns null if the player doesn't exist.
   */
  getPlayer(playerId: PlayerObject["id"]): PlayerObject;
  /**
   * Returns the current list of players
   */
  getPlayerList(): PlayerObject[];
  /**
   * If a game is in progress it returns the current score information. Otherwise it returns null
   */
  getScores(): ScoresObject;
  /**
   * Returns the ball's position in the field or null if no game is in progress.
   */
  getBallPosition(): Position;
  /**
   * Starts recording of a haxball replay.
   */
  startRecording(): void;
  /**
   * Stops the recording previously started with startRecording and returns the replay file contents as a Uint8Array.
   */
  stopRecording(): HBRecording;
  /**
   * Changes the password of the room, if pass is null the password will be cleared.
   */
  setPassword(): void;
  /**
   * Activates or deactivates the recaptcha requirement to join the room.
   */
  setRequireRecaptcha(): void;
  /**
   * First all players listed are removed, then they are reinserted in the same order they appear in the playerIdList.
   */
  reorderPlayers(): void;
  /**
   * Sends a host announcement with msg as contents
   */
  sendAnnouncement(
    msg: string,
    targetId?: number | null,
    color?: number | string | null,
    style?: string | null,
    sound?: number | null
  ): void;
  /**
   * Sets the room's kick rate limits.
   */
  setKickRateLimit(): void;
  /**
   * Overrides the avatar of the target player.
   */
  setPlayerAvatar(playerId: number, avatar: string | null): void;
  /**
   * Sets properties of the target disc.
   */
  setDiscProperties(
    discIndex: number,
    properties: Partial<DiscPropertiesObject>
  ): void;
  /**
   * Gets the properties of the disc at discIndex. Returns null if discIndex is out of bounds.
   */
  getDiscProperties(discId: number): DiscPropertiesObject;
  /**
   * Same as setDiscProperties but targets the disc belonging to a player with the given Id.
   */
  setPlayerDiscProperties(
    playerId: number,
    properties: Partial<DiscPropertiesObject>
  ): void;
  /**
   * Same as getDiscProperties but targets the disc belonging to a player with the given Id.
   */
  getPlayerDiscProperties(
    playerId: PlayerObject["id"]
  ): DiscPropertiesObject | null;
  /**
   * Gets the number of discs in the game including the ball and player discs.
   */
  getDiscCount(): number;

  /* EVENTS */

  /**
   * Event called when a new player joins the room.
   */
  set onPlayerJoin(func: (player: FullPlayerObject) => void);

  /**
   * Event called when a player leaves the room.
   */
  set onPlayerLeave(func: (player: PlayerObject) => void);
  /**
   * Event called when a team wins.
   */
  set onTeamVictory(func: (scores: ScoresObject) => void);

  /**
   * Event called when a player sends a chat message.
   * @return The event function can return false in order to filter the chat message. This prevents the chat message from reaching other players in the room.
   */
  set onPlayerChat(func: (player: PlayerObject, message: string) => boolean);

  /**
   * Event called when a player kicks the ball.
   */
  set onPlayerBallKick(func: (player: PlayerObject) => void);

  /**
   * Event called when a team scores a goal.
   */
  set onTeamGoal(func: (teamId: TeamId) => void);

  /**
   * Event called when a game starts.
   * @param byPlayer byPlayer is the player which caused the event (can be null if the event wasn't caused by a player).
   */
  set onGameStart(func: (byPlayer: PlayerObject | null) => void);

  /**
   * Event called when a game stops.
   * @param byPlayer byPlayer is the player which caused the event (can be null if the event wasn't caused by a player).
   */
  set onGameStop(func: (player: PlayerObject) => void);

  /**
   * Event called when the game is paused.
   * @param byPlayer byPlayer is the player which caused the event (can be null if the event wasn't caused by a player).
   */
  set onGamePause(func: (player: PlayerObject | null) => void);

  /**
   * Event called when the game is unpaused.
   * @param byPlayer byPlayer is the player which caused the event (can be null if the event wasn't caused by a player).
   * After this event there's a timer before the game is fully unpaused, to detect when the game has really resumed you can listen for the first onGameTick event after this event is called.
   */
  set onGameUnpause(func: (player: PlayerObject | null) => void);

  /**
   * Event called once for every game tick (happens 60 times per second). This is useful if you want to monitor the player and ball positions without missing any ticks.
   * This event is not called if the game is paused or stopped.
   */
  set onGameTick(func: () => void);

  /**
   * Event called when a player's admin rights are changed.
   * @param byPlayer is the player which caused the event (can be null if the event wasn't caused by a player).
   */
  set onPlayerAdminChange(
    func: (player: PlayerObject, byPlayer: PlayerObject | null) => void
  );

  /**
   * Event called when a player team is changed.
   * @param byPlayer is the player which caused the event (can be null if the event wasn't caused by a player).
   */
  set onPlayerTeamChange(func: (player: PlayerObject) => void);

  /**
   * Event called when a player has been kicked from the room. This is always called after the onPlayerLeave event.
   * @param byPlayer is the player which caused the event (can be null if the event wasn't caused by a player).
   */
  set onPlayerKicked(
    func: (
      kickedPlayer: PlayerObject,
      reason: string,
      ban: boolean,
      byPlayer: PlayerObject
    ) => void
  );

  /**
   * Event called when the players and ball positions are reset after a goal happens.
   */
  set onPositionsReset(func: () => void);

  /**
   * Event called when a player gives signs of activity, such as pressing a key. This is useful for detecting inactive players.
   */
  set onPlayerActivity(func: (player: PlayerObject) => void);

  /**
   * Event called when the stadium is changed.
   * @param byPlayer is the player which caused the event (can be null if the event wasn't caused by a player).
   */
  set onStadiumChange(
    func: (newStadiumName: string, byPlayer: PlayerObject) => void
  );

  /**
   * Event called when the room link is obtained.
   */
  set onRoomLink(func: (url: string) => void);

  /**
   * Event called when the kick rate is set.
   */
  set onKickRateLimitSet(
    func: (
      min: number,
      rate: number,
      burst: number,
      byPlayer: PlayerObject | null
    ) => void
  );
}
