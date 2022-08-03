import PlayData, { PlayDetails } from "../classes/PlayData";
import { PlayerReport } from "../classes/PlayerReport";
import PlayerStats from "../classes/PlayerStats";
import { PlayableTeamId, TeamId } from "../HBClient";
import {
  PlayerRecord,
  PlayerSubstitution,
} from "../roomStructures/PlayerRecorder";
import Room from "../roomStructures/Room";
import { MAP_POINTS } from "../utils/map";
import { TEAMS } from "../utils/types";
import DistanceCalculator from "./DistanceCalculator";
import MapReferee from "./MapReferee";
import PlayerReportBuilder from "./PlayerReportBuilder";

export default class GameReportBuilder {
  private _playerStats: PlayerStats[];
  private _playerRecords: PlayerRecord[];
  private _playByPlay: PlayData[];

  constructor(
    playerStats: PlayerStats[],
    playerRecords: PlayerRecord[],
    playByPlay: PlayData[]
  ) {
    this._playerStats = playerStats;
    this._playerRecords = playerRecords;
    this._playByPlay = playByPlay;
  }

  build(duration: number, redScore: number, blueScore: number): GameReport {
    const redPassData = this._getPassData(TEAMS.RED);
    const bluePassData = this._getPassData(TEAMS.RED);

    const mvpData = this._getMVP();

    const mvpDataRecordId = mvpData?.recordId ?? null;

    const winningTeam = this._getWinningTeam(redScore, blueScore);

    const players = this._mapPlayerReports(winningTeam);

    const timeline = this._createTimeline();

    return {
      winningTeam,
      gameStats: {
        duration,
        redScore,
        blueScore,
        timeline,
        redPassData,
        bluePassData,
        mvp: mvpDataRecordId,
      },
      players,
    };
  }

  private _mapPlayerReports(winningTeamId: TeamId) {
    return this._playerRecords.map((record) => {
      const playerStats = this._playerStats.find(
        (stat) => stat.recordId === record.recordId
      );
      if (!playerStats) throw Error("Couldnt find playerstat");
      return new PlayerReportBuilder(
        record,
        playerStats,
        winningTeamId
      ).build();
    });
  }

  private _getWinningTeam(redScore: number, blueScore: number) {
    if (redScore > blueScore) return TEAMS.RED;
    if (blueScore > redScore) return TEAMS.BLUE;
    return TEAMS.SPECTATORS;
  }

  private _mapScorePlays(): ScoringSummaryItem[] {
    interface ScorePlayAndIndexes {
      scoringPlayIndexes: number[];
      scoringPlays: PlayData[];
    }

    const { scoringPlayIndexes, scoringPlays } = this._playByPlay.reduce(
      (acc: ScorePlayAndIndexes, play, index) => {
        if (play.playDetails.hasOwnProperty("scoreDescription")) {
          acc.scoringPlayIndexes.push(index);
          acc.scoringPlays.push(play);
        }
        return acc;
      },
      { scoringPlayIndexes: [], scoringPlays: [] }
    );

    return scoringPlays.map((scoringPlay, index) => {
      const currentPlayScoreIndex = scoringPlayIndexes[index];
      const lastPlayScoreIndex = scoringPlayIndexes[index - 1] ?? -1;
      const lastPlayScoreTime = scoringPlays[index - 1]?.endTime ?? 0;

      const numbPlays = currentPlayScoreIndex - lastPlayScoreIndex;
      const duration = scoringPlay.endTime - lastPlayScoreTime;

      const playDetails = scoringPlay.playDetails as Required<PlayDetails>;

      const scoringItem: ScoringSummaryItem = {
        itemType: "Score",
        team: scoringPlay.offense,
        half: scoringPlay.half,
        time: scoringPlay.startTime,
        numbPlays,
        driveDuration: duration,
        ...playDetails,
      };

      return scoringItem;
    });
  }

  private _createTimeline(): TimeLineItem[] {
    const scoringPlays = this._mapScorePlays();

    // We wanna get all the subs that weren't at the start of the game or at the end of the game
    const subsThatWerentAtTheEndOrStart = this._playerRecords.reduce(
      (acc: SubstitutionItem[], record) => {
        const filtered: PlayerSubstitution[] = record.substitutions.filter(
          (sub) => {
            const subWasAnInitialSubIn = sub.time === 0 && sub.type === "IN";
            return subWasAnInitialSubIn === false;
          }
        );
        // Remove their last sub as well
        if (record.wasAtEndOfGame) filtered.pop();
        const filteredMapped = filtered.map((sub) => {
          const subItem: SubstitutionItem = {
            itemType: "Substitution",
            team:
              sub.toTeam === TEAMS.SPECTATORS
                ? (sub.fromTeam as PlayableTeamId)
                : (sub.toTeam as PlayableTeamId),
            half: 1,
            time: sub.time,
            type: sub.type,
            player: record.recordId,
          };
          return subItem;
        });
        return [...acc, ...filteredMapped];
      },
      []
    );

    const timeLineUnsorted = [
      ...scoringPlays,
      ...subsThatWerentAtTheEndOrStart,
    ];

    return timeLineUnsorted.sort((a, b) => a.time - b.time);
  }

  private _getPassData(teamId: TeamId): TeamPassData {
    const teamPlayers = this._playerRecords.filter(
      (playerRecord) => playerRecord.team === teamId
    );

    // Now we have to find one of the teamPlayers who has the most pass attempts

    const teamPlayerWithMostPassAttempts = teamPlayers.reduce(
      (
        acc: { attempts: number; record: PlayerRecord | null },
        playerRecord
      ) => {
        const playerStats = Room.game.stats.statsCollection.get(
          playerRecord.recordId
        );
        if (!playerStats)
          throw new Error(
            `Could not find player stats using ID ${playerRecord.recordId}`
          );
        return playerStats.totalPassAttempts > acc.attempts
          ? { attempts: playerStats.totalPassAttempts, record: playerRecord }
          : acc;
      },
      { attempts: 0, record: null }
    );

    const { record } = teamPlayerWithMostPassAttempts;

    if (record === null) return null;

    const allPassPlaysFromPlayer = this._playByPlay.filter((play) => {
      return (
        play.playDetails.hasOwnProperty("isIncomplete") &&
        record?.ids.includes(play.playDetails.quarterback!)
      );
    });

    const adjustXAndY = (passPlay: PlayData) => {
      if (!passPlay.playDetails.passEndPosition)
        throw Error("No pass end position");

      const { x: passPlayXPosition, y: passPlayYPosition } =
        passPlay.playDetails.passEndPosition;

      const adjustedY =
        passPlayYPosition > 0
          ? -passPlayYPosition
          : Math.abs(passPlayYPosition);

      const tenYardsBehindLos = new DistanceCalculator()
        .subtractByTeam(
          passPlay.losX,
          MAP_POINTS.YARD * 10,
          passPlay.offense as PlayableTeamId
        )
        .calculate();

      const isBehindTenYardsBehindLos = MapReferee.checkIfBehind(
        passPlayXPosition,
        tenYardsBehindLos,
        passPlay.offense as PlayableTeamId
      );

      if (isBehindTenYardsBehindLos) return { x: 0, y: adjustedY };

      const distance = new DistanceCalculator()
        .calcDifference2D(tenYardsBehindLos, passPlayXPosition)
        .calculate();

      return {
        x: distance,
        y: adjustedY,
      };
    };

    const getPassEndResult = (passPlay: PlayData): PassPlayResult => {
      if (passPlay.playDetails.hasOwnProperty("isInterception"))
        return "Interception";
      if (passPlay.playDetails.isIncomplete) return "Incomplete";
      if (passPlay.playDetails.scoreType === "Touchdown") return "Touchdown";
      return "Catch";
    };

    const passPlaysMapped = allPassPlaysFromPlayer.map((passPlay) => {
      const { x, y } = adjustXAndY(passPlay);
      return {
        x,
        y,
        result: getPassEndResult(passPlay),
      };
    });

    return {
      quarterback: record.recordId,
      passPlays: passPlaysMapped,
    };
  }

  private _getMVP() {
    const POINT_PER_STAT_MAP: Partial<Record<keyof PlayerStats, number>> = {
      // Receiving
      totalReceptions: 1,
      totalReceivingYards: 0.1,
      rushingYards: 1,
      touchdownsReceived: 6,
      touchdownsRushed: 6,

      // Passing
      totalPassAttempts: 0,
      totalPassCompletions: 1,
      totalPassYards: 0.04,
      touchdownsThrown: 4,
      interceptionsThrown: -12,
      qbSacks: 0,

      // Defense
      totalPassDeflections: 5,
      tackles: 3,
      totalYardsAllowed: -1,
      sacks: 6,
      forcedFumbles: 0,
      interceptionsReceived: 12,

      // Misc
      penalties: -10,
    };

    const playersStatsWithPoints = this._playerStats.map((statsObj) => {
      const statsPoints = Object.entries(
        Object.getOwnPropertyDescriptors(statsObj)
      ).reduce(
        (
          acc: Partial<Record<keyof typeof POINT_PER_STAT_MAP, number>>,
          propKeyDescriptor
        ) => {
          const [statName, keyValue] = propKeyDescriptor;

          const statValue =
            (keyValue.value || (keyValue.get && keyValue.get())) ?? 0;

          if (statName in POINT_PER_STAT_MAP === false) return acc;

          const statPointValue: number = POINT_PER_STAT_MAP[statName];

          acc[statName] = statValue * statPointValue;

          return acc;
        },
        {}
      );

      return { playerAuth: statsObj.recordId, statsPoints };
    });

    // Ok now just add up the points

    const eachPlayersPoints = playersStatsWithPoints.map((playerStatObj) => {
      const pointTotal = Object.values(playerStatObj.statsPoints).reduce(
        (a, b) => a + b
      );
      return {
        recordId: playerStatObj.playerAuth,
        pointTotal,
      };
    });

    // Alas, now lets find the player with the highest point total and return his auth
    const playerWithMostPoints = eachPlayersPoints.reduce(
      (prev, current) =>
        prev.pointTotal > current.pointTotal ? prev : current,
      { recordId: 0, pointTotal: 0 }
    );

    if (playerWithMostPoints.pointTotal === 0) return null;

    return {
      recordId: playerWithMostPoints.recordId,
      pointTotal: playerWithMostPoints.pointTotal,
    };
  }
}

interface TimeLineItem {
  itemType: "Score" | "Substitution";
  team: PlayableTeamId;
  half: 1 | 2;
  time: number;
}

interface ScoringSummaryItem extends TimeLineItem {
  description: string;
  driveDuration: number;
  numbPlays: number;
  type: PlayDetails["type"];
  scorer1: number;
  scorer2?: number;
  redScore: number;
  blueScore: number;
}

interface SubstitutionItem extends TimeLineItem {
  type: PlayerSubstitution["type"];
  player: PlayerRecord["recordId"];
}

type PassPlayResult = "Incomplete" | "Catch" | "Interception" | "Touchdown";

type TeamPassData = {
  quarterback: PlayerRecord["recordId"];
  passPlays: {
    x: number;
    y: number;
    result: PassPlayResult;
  }[];
} | null;

interface GameReport {
  winningTeam: TeamId;
  players: PlayerReport[];
  gameStats: {
    duration: number;
    redScore: number;
    blueScore: number;
    timeline: TimeLineItem[];
    redPassData: any;
    bluePassData: any;
    mvp: number | null;
  };
}
