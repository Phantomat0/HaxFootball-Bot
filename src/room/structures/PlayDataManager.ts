import PlayData, { SnapPlayDetails } from "../classes/PlayData";

export default class PlayDataManager {
  playData: PlayData;
  playEvents: string[] = [];

  initializePlay(playDataParams: any) {
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
    console.log("PUSH:", playEventDescription);
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
    this.playData.playDetails.scoringDescription = scoringDesc;
  }

  addSnapPlayDetail(detail: Partial<SnapPlayDetails>) {
    this.playData.playDetails = { ...this.playData.playDetails, ...detail };
  }
}
