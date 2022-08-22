import client from "..";
import { FullPlayerObject, PlayerObject, Position, TeamId } from "../HBClient";
import Room from "../roomStructures/Room";
import { truncateName } from "../utils/utils";

export type PlayerAdminLevel = 0 | 1 | 2 | 3 | 4;

export default class Player {
  readonly name: FullPlayerObject["name"];
  readonly id: FullPlayerObject["id"];
  readonly auth: FullPlayerObject["auth"];
  readonly ip: FullPlayerObject["conn"];
  private _adminLevel: PlayerAdminLevel;
  isAFK: boolean = false;
  canPlay: boolean = true;

  constructor({ name, id, auth, conn }: FullPlayerObject) {
    this.name = name.trim();
    this.id = id;
    this.auth = auth;
    this._adminLevel = 0;
    this.ip = conn;
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
    return this;
  }

  /**
   * Set the player's admin level
   */

  setAdminLevel(adminLevel: PlayerAdminLevel) {
    this._adminLevel = adminLevel;
    return this;
  }

  /**
   * Set the player's team
   */
  setTeam(teamID: TeamId) {
    const player = client.getPlayer(this.id);
    if (player) client.setPlayerTeam(this.id, teamID);
  }

  /**
   * Can this player moderate said player?
   */
  canModerate(player: Player): boolean {
    return this.adminLevel > player.adminLevel;
  }

  /**
   * Set the player as AFK or unafk
   */
  setAFK(makeAFK: boolean) {
    this.isAFK = makeAFK;
  }
}
