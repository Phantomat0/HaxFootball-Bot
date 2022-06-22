// import Player from "../classes/Player";
// import { IBanObj, IBlackListObj } from "./Players/Bans";
// import { escapeRegExp } from "../utils/utils";
// import DBUser, {
//   DBUserStats,
//   UUID,
// } from "../structures/DBUser";
// import { GameReport } from "../structures/GameReportBuilder";

// // All puppeteer exposed functions start with a _
// declare function _uploadGame(game: GameReport): Promise<string>;
// declare function _getUser(options: any): Promise<DBUser | null>;
// declare function _getUserByName(name: Player["name"]): Promise<DBUser> | null;
// declare function _getUserByAuth(options: any): Promise<DBUser> | null;
// declare function _getUserStatsById(_id: UUID): Promise<DBUserStats>;
// declare function _getUserStatsByUUID(uuid: UUID): Promise<DBUserStats>;
// declare function _getTotalGamesAndPlayers(): Promise<{
//   games: number;
//   players: number;
// }>;
// declare function _addBan(banSchema: IBanObj): Promise<void>;
// declare function _clearBan(banId: string): Promise<void>;
// declare function _getBanList(): Promise<IBanObj[]>;
// declare function _getBlacklist(): Promise<IBlackListObj[]>;
// >;
// declare function _getRandomTopTenStat(): Promise<{
//   statName: string;
//   topTen: { stat: number; name: string }[];
// }>;
// declare function _setRoomLink(url: string): Promise<void>;
// declare function _getPlayerRegistrationDetails(auth: string): Promise<{
//   token: string;
//   username: string;
//   auth: string;
//   ip: string;
//   countryCode: string;
// }>;
// declare function _createPlayerRegistrationDetails(playerDetails: {
//   name: string;
//   auth: string;
//   ip: string;
//   countryCode: string;
// }): Promise<{
//   token: string;
//   username: string;
//   auth: string;
//   ip: string;
//   countryCode: string;
// }>;

// export module DB {
//   /**
//    * Get a User by their name, first searching for an exact match, then a partial match
//    */
//   export async function getUserByName(
//     name: Player["name"]
//   ): Promise<DBUser> | null {
//     const escapedRegex = escapeRegExp(name);

//     // First lets look for an exact match
//     const exactUserNameMatch = await getUserByNameExact(name);

//     if (exactUserNameMatch) return exactUserNameMatch;

//     // Now we can use partial
//     return await _getUser({
//       name: {
//         $regex: escapedRegex,
//         $options: "i",
//       },
//     });
//   }

//   /**
//    * Get a user by their exact name, case insensitive
//    */
//   export async function getUserByNameExact(name: Player["name"]) {
//     return _getUserByName(name);
//   }

//   /**
//    * Upload the game to the database
//    */
//   export async function uploadGame(game: GameReport) {
//     return await _uploadGame(game);
//   }

//   /**
//    * Return a user using any MongoDB query
//    */
//   export async function getUser(options: any) {
//     return await _getUser(options);
//   }

//   /**
//    * Return a user using by searching auth
//    */
//   export async function getUserByAuth(playerAuth: any) {
//     return await _getUserByAuth(playerAuth);
//   }

//   /**
//    * Return a user's stats
//    * @param _id The id of the player's stats document
//    */
//   export async function getUserStatsById(_id: UUID): Promise<DBUserStats> {
//     return await _getUserStatsById(_id);
//   }

//   export async function getUserStatsByUUID(uuid: UUID): Promise<DBUserStats> {
//     return await _getUserStatsByUUID(uuid);
//   }

//   /**
//    * Return total games played and total registered players
//    */
//   export async function getTotalGamesAndPlayers() {
//     return await _getTotalGamesAndPlayers();
//   }

//   /**
//    * Add a ban
//    * @param IBanObj banListSchema
//    */
//   export async function addBan(banSchema: IBanObj) {
//     await _addBan(banSchema);
//   }

//   /**
//    * Unban a player
//    * @param banId banId
//    */
//   export async function clearBan(banId: string) {
//     await _clearBan(banId);
//   }

//   /**
//    * Returns the ban list
//    */
//   export async function getBanList() {
//     return await _getBanList();
//   }

//   /**
//    * Returns the blacklist
//    */
//   export async function getBlacklist() {
//     return await _getBlacklist();
//   }

//   /**
//    * Set the room link in the room's config document
//    */
//   export async function setRoomLink(url: string) {
//     await _setRoomLink(url);
//   }

//   /**
//    * Gets the user registration details
//    */
//   export async function getPlayerRegistrationDetails(auth: string) {
//     return await _getPlayerRegistrationDetails(auth);
//   }

//   /**
//    * Creates a user registration details
//    */
//   export async function createPlayerRegistrationDetails(playerDetails: {
//     name: string;
//     auth: string;
//     ip: string;
//     countryCode: string;
//   }) {
//     return await _createPlayerRegistrationDetails(playerDetails);
//   }

//   export async function tester() {}
// }
