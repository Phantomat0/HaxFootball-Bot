import client from "../..";
import Player from "../../classes/Player";
import { FullPlayerObject } from "../../HBClient";
import Collection from "../../utils/Collection";
import Room from "../Room";

type BanId = string;

export interface IBanObj {
  banId: string;
  roomId: 1;
  name: FullPlayerObject["name"];
  playerRoomIds: FullPlayerObject["id"][];
  byBot: boolean;
  expirationDate: Date | -1;
  reason: string | null;
  description?: string | null;
  auth?: FullPlayerObject["auth"][];
  ip?: string[];
  byName?: string | null;
  byUUID?: string | null;
}

export interface IBlackListObj {
  name: FullPlayerObject["name"];
  auth: FullPlayerObject["auth"][];
  ip?: string[];
  reason: string;
}

interface BanInfo {
  bannedPlayer: Player;
  reason: string | null;
  durationInMS: number | -1;
  description?: string;
  byPlayer?: Player;
}

export default class BanManager {
  recentlyKickedPlayer: Player | null = null;
  private readonly _banCollection: Collection<BanId, IBanObj> =
    new Collection();
  private readonly _blackListCollection: Collection<number, IBlackListObj> =
    new Collection();

  checkIfPlayerBlacklisted(auth: Player["auth"], ip: Player["ip"]) {
    const blackListedByAuth = this._blackListCollection.findOne({
      auth: [auth],
    });
    const blackListedByIp = this._blackListCollection.findOne({ ip: [ip] });

    return blackListedByAuth || blackListedByIp;
  }

  checkIfPlayerBanned(auth: Player["auth"], ip: Player["ip"]) {
    console.log(this._banCollection);
    console.log(auth, ip);
    const bannedByAuth = this._banCollection.findOne({ auth: [auth] });
    const bannedByIp = this._banCollection.findOne({ ip: [ip] });

    return bannedByAuth || bannedByIp;
  }

  async loadBanList() {
    // const banList = await DB.getBanList();
    // // Here, lets add the player room Ids
    // const adjustedBanList = banList.map((ban) => {
    //   const { playerRoomIds = [] } = this._banCollection.get(ban.banId) ?? {};
    //   return { ...ban, playerRoomIds };
    // });
    // // The room ids arent saved in the database, since we dont need to save them
    // // We just need them saved for every session
    // this._banCollection.clear();
    // adjustedBanList
    //   .filter((ban) => ban.roomId === Room.roomId)
    //   .forEach((ban) => {
    //     this._banCollection.set(ban.banId, ban);
    //   });
  }
  async loadBlackList() {
    // const blackList = await DB.getBlacklist();
    // this._blackListCollection.clear();
    // blackList.forEach((ban, index) =>
    //   this._blackListCollection.set(index, ban)
    // );
  }

  banPlayer(
    player: Player,
    banInfo: Omit<BanInfo, "byPlayer" | "bannedPlayer">
  ) {
    this.recentlyKickedPlayer = player;
    client.kickPlayer(player.id, banInfo.reason, true);
    this.saveBan({ ...banInfo, bannedPlayer: player });
  }

  setRecentlyKickedPlayer(player: Player) {
    this.recentlyKickedPlayer = player;
  }

  kickPlayer(player: Player, message: string | null = null) {
    this.recentlyKickedPlayer = player;
    client.kickPlayer(player.id, message, false);
  }

  /**
   * Attempts to clear a ban
   * @param banId BanId of the player
   */
  clearBan(banId: BanId): {
    error: boolean;
    errorMsg?: string;
    banObj?: IBanObj;
  } {
    const banObj = this._banCollection.get(banId);

    if (!banObj)
      return {
        error: true,
        errorMsg: `Player with banId ${banId} does not exist in the ban list`,
      };

    const { playerRoomIds } = banObj;

    // Remove ban from room, can have multiple Ids if the player
    // was attempting to evade bans
    playerRoomIds.forEach((playerId) => {
      client.clearBan(playerId);
    });

    // Remove ban from our collection
    this._banCollection.delete(banId);

    // Remove from database

    // DB.clearBan(banId);

    return {
      error: false,
      banObj,
    };
  }

  checkForExpiredBans() {
    this._banCollection.forEach((ban) => {
      // If its -1, it never expires
      if (ban.expirationDate === -1) return;
      const banExpired = ban.expirationDate > new Date();
      if (banExpired) this.clearBan(ban.banId);
    });
  }

  addRoomIdToBanObj(kickedPlayerProfile: Player, banRecord: IBanObj) {
    banRecord.playerRoomIds.push(kickedPlayerProfile.id);
    this._banCollection.set(banRecord.banId, banRecord);
  }

  saveBan(banInfo: BanInfo) {
    // First, check if the player is already in the ban list
    // The kicked player's profile has been deleted, so we have to access it through a saved property
    const kickedPlayerProfile =
      banInfo.bannedPlayer || this.recentlyKickedPlayer;

    if (!kickedPlayerProfile) return;

    // Check if this was an attempt to bypass the ban system, since they're already banned
    const alreadyHasABanRecord = this.checkIfPlayerBanned(
      kickedPlayerProfile.auth,
      kickedPlayerProfile.ip
    );

    if (alreadyHasABanRecord) return;

    const banPayload = this._getBanPayload(kickedPlayerProfile, banInfo);

    const banId = this._getBanId(kickedPlayerProfile.id);

    this._banCollection.set(banId, banPayload);

    // DB.addBan(banPayload);
  }

  private _getBanId(playerId: Player["id"]): BanId {
    return `${Room.sessionId}${playerId}`;
  }

  private _getBanPayload(
    kickedPlayerProfile: Player,
    banInfo: BanInfo
  ): IBanObj {
    const banExpirationDate =
      banInfo.durationInMS === -1
        ? -1
        : new Date(Date.now() + banInfo.durationInMS);

    const banId = this._getBanId(kickedPlayerProfile.id);

    if (!banInfo.byPlayer)
      return {
        roomId: Room.roomId,
        banId: banId,
        name: kickedPlayerProfile.name,
        auth: [kickedPlayerProfile.auth],
        ip: [kickedPlayerProfile.ip],
        playerRoomIds: [kickedPlayerProfile.id],
        reason: banInfo.reason,
        description: banInfo.description,
        expirationDate: banExpirationDate,
        byBot: true,
      };

    return {
      roomId: 1,
      banId: banId,
      name: kickedPlayerProfile.name,
      auth: [kickedPlayerProfile.auth],
      ip: [kickedPlayerProfile.ip],
      playerRoomIds: [kickedPlayerProfile.id],
      reason: banInfo.reason,
      description: banInfo.description,
      expirationDate: banExpirationDate,
      byBot: false,
      byName: banInfo.byPlayer.name,
      byUUID: banInfo.byPlayer.dbUser?._id ?? null,
    };
  }
}
