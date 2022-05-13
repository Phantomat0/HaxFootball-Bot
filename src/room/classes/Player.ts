import Room, { client } from "..";
import { FullPlayerObject, PlayerObject, Position } from "../HBClient";
import { hexToAscii, truncateName } from "../utils/utils";

type PlayerAdminLevel = 0 | 1 | 2 | 3 | 4;

export default class Player {
  readonly name: FullPlayerObject["name"];
  readonly id: FullPlayerObject["id"];
  readonly auth: FullPlayerObject["auth"];
  readonly ip: FullPlayerObject["conn"];
  private _adminLevel: PlayerAdminLevel;
  isAFK: boolean = false;
  canPlay: boolean;

  constructor({ name, id, auth, conn }: FullPlayerObject) {
    this.name = name.trim();
    this.id = id;
    this.auth = auth!;
    this._adminLevel = 0;
    this.ip = hexToAscii(conn!);
  }

  setCanPlay(bool: boolean) {
    this.canPlay = bool;
  }

  /**
   * Returns player team
   */
  get team(): FullPlayerObject["team"] | null {
    const player = client.getPlayer(this.id);
    if (player) return player.team;
    return null;
  }

  /**
   * Returns player position, can be null if the player is not fielded
   */
  get position(): Position | null {
    const player = client.getPlayer(this.id);
    if (player) return player.position;
    return null;
  }

  /**
   * Get admin level
   */
  get adminLevel(): PlayerAdminLevel {
    const adminLevel = this._adminLevel;
    if (adminLevel === 0) {
      if (this.isAdmin) return 1;
      return 0;
    }

    return adminLevel;
  }

  /**
   * Returns the player's native player object
   */
  get playerObject(): PlayerObject | null {
    return client.getPlayer(this.id);
  }

  /**
   * Return name all lowercase
   */
  get lowerName(): string {
    return this.name.toLowerCase();
  }

  /**
   * Return name truncated
   */
  get shortName(): string {
    return truncateName(this.name);
  }

  /**
   * Is the player muted?
   */

  get isMuted(): boolean {
    return Room.players.muted.mutedCollection.has(this.auth);
  }

  /**
   * Do they have gold/admin in the room?
   */

  get isAdmin(): boolean {
    const player = client.getPlayer(this.id);
    if (!player) return false;
    return player.admin;
  }

  /**
   * Set this player's admin status
   */

  setAdmin(bool: boolean) {
    client.setPlayerAdmin(this.id, bool);
  }

  /**
   * Set the player's admin level
   */

  setAdminLevel(adminLevel: PlayerAdminLevel) {
    this._adminLevel = adminLevel;
  }

  /**
   * Can this player moderate said player?
   */

  canModerate(player: Player): boolean {
    return this.adminLevel > player.adminLevel;
  }

  /**
   * Set the player's team
   */

  setTeam(teamID: PlayerObject["team"]) {
    const player = client.getPlayer(this.id);
    if (player) client.setPlayerTeam(this.id, teamID);
  }

  /**
   * Mute or unmute the player
   */
  //   setMute(makeMuted: boolean, playerMuting: Player | "bot") {
  //     return makeMuted
  //       ? this.room.players.addMute(this, playerMuting)
  //       : this.room.players.removeMute(this.auth);
  //   }

  /**
   * Move the player to a position
   */

  setPosition(position: Partial<Position>) {
    if ("x" in position && "y" in position) {
      return client.setPlayerDiscProperties(this.id, {
        x: position.x,
        y: position.y,
      });
    }
    if ("x" in position) {
      return client.setPlayerDiscProperties(this.id, {
        x: position.x,
      });
    }
    if ("y" in position) {
      return client.setPlayerDiscProperties(this.id, {
        y: position.y,
      });
    }
  }

  /**
   * Set the player as AFK or unafk
   */
  setAFK(makeAFK: boolean) {
    this.isAFK = makeAFK;
  }

  /**
   * Kick the player from the room
   */
  async kick(reason?: string) {
    // await this.room.players.bans.setRecentPlayerKicked(this);
    // await this.room.client.kickPlayer(this.id, reason, false);
  }

  //   /**
  //    * Ban the player from the room
  //    * @param byPlayer Player Banning
  //    * @param reason Reason for ban
  //    * @param duration Duration of ban in MS, defaults to -1 which is permanent
  //    */
  //   async ban({
  //     byPlayer = null,
  //     reason = "Unspecified",
  //     description = null,
  //     durationInMS = -1,
  //   }: {
  //     byPlayer?: PlayerObject | Player | null;
  //     reason?: string;
  //     description?: string;
  //     durationInMS?: number;
  //   } = {}) {
  //     await this.room.players.bans.setRecentPlayerKicked(this);
  //     console.log("this ran");
  //     await this.room.client.kickPlayer(this.id, reason, true);
  //     await this.room.players.bans.addBanThroughRoom(
  //       reason,
  //       byPlayer,
  //       durationInMS,
  //       description
  //     );
  //   }

  //   /**
  //    * Send the player a private message
  //    */
  //   sendMessage(msg: string, options: MessageOptions = {}) {
  //     options.id = this.id;
  //     this.room.chat.send(msg, options);
  //   }

  //   /**
  //    * Send the player a private notification
  //    */
  //   sendNotification(msg: string, options: MessageOptions = {}) {
  //     this.room.chat.sendNotification(msg, { id: this.id });
  //   }

  //   /**
  //    * Send the player a private warning
  //    */
  //   sendWarning(msg: string, options: MessageOptions = {}) {
  //     options.icon = ICONS.RedTriangle;
  //     options.color = COLORS.LightRed;
  //     options.sound = 2;
  //     options.style = MESSAGE_STYLE.Bold;
  //     options.id = this.id;
  //     this.room.chat.send(msg, options);
  //   }
}
