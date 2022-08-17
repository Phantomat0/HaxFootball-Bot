# 🏈 Haxfootball Bot

American Football gameplay implemented in haxball. Rules adapted to fit 5v5 and 4v4 games.

Contents:

1.  Full source code, separated into files and folders, found in **/src**
2.  Single file, compiled source code, found in **/dist/room-bundle.js**
3.  Single file, old Season 13 HFL bot, by I'llhaveanother found in **/dist/hfl-13.js**

# ⚙️ Usage

You can use the code in two ways

1.  Copy the **room-bundle.js** file found in **/dist** and paste it in the console on https://www.haxball.com/headless
2.  Use the built in RoomLoader class to load the room using puppeteer.

### Using Haxball Headless

1. Go to https://www.haxball.com/headless
2. Right Click => Inspect Element
3. Go to to the tab labeled "console"
4. Select "top" from the dropdown
5. Paste the code, and press enter

**How do I change the name of the room, or make it private?**
Do CTRL + F and search for "HAXFOOTBALL" which is the name of the room, and then you can change it to whatever you would like.

### Using Puppeteer RoomLoader

Webpack will create two bundles, one for the room, and one for index.ts to actually load the rooms using puppeteer.

1. First run the **build** command so you can build both bundles.

   npm run build

2. Configure changes in **/server/index.ts** to your liking, i.e headless mode and auto join

3. Run the **start** command to load the room.

   npm run start

# 🛠️Features

Alongside the standard Haxfootball rules and gameplay are additional features to enhance the room.

#### Stats

- 25+ unique stats for each player
- MVP at the end of each game determined using Fantasy Football Rating system

#### Command System

Command system with permissions, alias names, error handling.

**Gameplay commands**

| Name       | Alias | Description                                              | Usage                   |
| ---------- | ----- | -------------------------------------------------------- | ----------------------- |
| dd         |       | Returns the down and distance                            |                         |
| score      |       | Returns the score                                        |                         |
| setscore   | ss    | Sets the score for a team                                | setscore blue 7, ss b 7 |
| setlos     | sl    | Sets the line of scrimmage at a certain yard             | setlos blue 10, sl b 10 |
| setplayers | sp    | Sets the players in front of the LOS                     |                         |
| setdown    | sd    | Sets the down and distance                               | setdown 2 15, sd 4      |
| stats      |       | View your stats or the stats of another player           | stats, stats tda        |
| swap       |       | Swaps red and blue teams players                         |                         |
| swapo      |       | Swaps offense and defense                                |                         |
| release    |       | Releases the ball, making it movable                     |                         |
| reset      |       | Ends the current play                                    |                         |
| revert     | rv    | Reverts the LOS, down, and distance to the previous play |                         |

**Play Commands**

| Name   | Description                                        |
| ------ | -------------------------------------------------- |
| hike   | Snaps the ball                                     |
| cp     | Enables a curved pass                              |
| tei    | Sets you as the tight end                          |
| punt   | Calls a punt                                       |
| fg     | Field Goal                                         |
| 2pt    | Initiates a two point conversion after a touchdown |
| onside | Initiates an onside kick during a kickoff          |
| to     | Calls a timeout and pauses the game                |

Use t to team chat

#### Discord Logging

Just configure **WEB_HOOK_URL** with the url of your discord webhook to get started.

```js
const WEB_HOOK_URL = "URL";

Discord.log("Hello");
```

#### Auto Admin & Admin Code

Auto Mod ensures there is at least one admin in the room at all times, giving the first player on the spectators list admin.

On each room load, a randomized admin password will be outputted to the console, simply use the **!admin CODE** command to receive admin in the room.

#### Moderation

- Mute players using !mute playername
- Players are kicked if they join with duplicate auth codes or  
  connections.
- N word filter
