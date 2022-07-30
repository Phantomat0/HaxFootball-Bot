import PlayData, { PlayDetails } from "../classes/PlayData";

export default class PlayDataManager {
  playData: PlayData;
  playEvents: string[] = [];

  initializePlay(playDataParams: ConstructorParameters<typeof PlayData>[0]) {
    this.playData = new PlayData(playDataParams);
  }

  recordPlayEndTime(endTime: number) {
    this.playData.endTime = endTime;
    this.playData.duration = endTime - this.playData.startTime;
  }

  pushDescription(playEventDescription: string) {
    this.playEvents.push(playEventDescription);
  }

  pushToStartDescription(playEventDescription: string) {
    this.playEvents.unshift(playEventDescription);
  }

  removeStartDescription() {
    this.playEvents.shift();
  }

  generatePlayDescription() {
    const playDesc = this.playEvents.join(" ");
    this.playData.playDetails.description = playDesc;
    return playDesc;
  }

  setScoringDescription(scoringDesc: string) {
    this.playData.playDetails.scoreDescription = scoringDesc;
  }

  setScoreType(
    scoreType: PlayDetails["scoreType"],
    scoreDescription: string,
    scorerIds: { scorer1: number; scorer2?: number } | null = null
  ) {
    this.playData.playDetails.scoreType = scoreType;
    this.playData.playDetails.scoreDescription = scoreDescription;
    if (scorerIds === null) return;
    const { scorer1, scorer2 = null } = scorerIds;
    this.playData.playDetails.scorer1 = scorer1;
    if (scorer2 === null) return;
    this.playData.playDetails.scorer2 = scorer2;
  }

  setPlayDetails(playDetails: Partial<PlayDetails>) {
    this.playData.playDetails = {
      ...this.playData.playDetails,
      ...playDetails,
    };
  }
}
