const PLAY_BY_WEBHOOK_URL = "URL";

export default class Discord {
  log = new DiscordLogger(PLAY_BY_WEBHOOK_URL);
}

interface DiscordEmbedField {
  name: string;
  value: string;
}

interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
}

interface LogOptions {
  escapeMarkDown: boolean;
}

class DiscordLogger {
  private _webhookURL: string;

  constructor(webhookURL: string) {
    this._webhookURL = webhookURL;
  }
  log(msg: string) {
    this._log(msg);
  }

  /**
   * Escapes all Discord markdown, * _ ~ @
   * Prevent users from using @, like @everyone or @here
   * @returns Sanitized string
   */
  private _escapeMarkDown(msg: string): string {
    const REGEXP = /[_\*\~\@\|`]/g;
    return msg.replace(REGEXP, "\\$&");
  }

  /**
   * @returns BLANK_NAME if name is blank
   */
  // private _sanitizePlayerName(playerName: string) {
  //   return playerName.length === 0 ? "BLANK_NAME" : playerName;
  // }

  // private async _logEmbed({
  //   msgContent = "",
  //   embeds,
  // }: {
  //   msgContent?: string;
  //   embeds: DiscordEmbed[];
  // }) {
  //   return await fetch(this._webhookURL, {
  //     method: "POST",
  //     headers: {
  //       "content-type": "application/json",
  //     },
  //     body: JSON.stringify({ content: msgContent, embeds: embeds }),
  //   });
  // }

  private async _log(
    msg: string,
    logOptions: LogOptions = { escapeMarkDown: true }
  ) {
    if (logOptions.escapeMarkDown) {
      msg = this._escapeMarkDown(msg);
    }
    return await fetch(this._webhookURL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ content: msg }),
    });
  }
}
