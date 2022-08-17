import Puppeteer from "puppeteer";
import { getRandomChars } from "../room/utils/utils";

export interface RoomOptions {
  name: string;
  bundlePath: string;
  exposeFunction?: (page: Puppeteer.Page) => Promise<void>;
  joinRoom?: boolean;
  joinName?: string;
}

interface PuppeteerOptions {
  isHeadless: boolean;
}

const HAXBALL_HEADLESS_URL = "https://www.haxball.com/headless";

export default class RoomLoader {
  private _browser: Puppeteer.Browser | null = null;
  private _options: PuppeteerOptions;

  constructor(options: PuppeteerOptions) {
    this._options = options;
  }
  async loadRooms(rooms: RoomOptions[]) {
    await Promise.all(rooms.map(this._loadRoom.bind(this)));
  }

  private async _loadRoom(roomOptions: RoomOptions) {
    if (!this._browser) await this._loadBrowser(this._options.isHeadless);

    const browser = this._browser as Puppeteer.Browser;

    const haxballAPIPage = (await browser.pages())[0];

    await haxballAPIPage.goto(HAXBALL_HEADLESS_URL, {
      waitUntil: "networkidle2",
    });

    const {
      exposeFunction = null,
      bundlePath,
      name,
      joinRoom = false,
      joinName,
    } = roomOptions;

    if (exposeFunction) await exposeFunction(haxballAPIPage);

    await haxballAPIPage.addScriptTag({ path: bundlePath });

    const haxballAPIIframe = haxballAPIPage
      .frames()
      .find((frame) => frame.parentFrame() !== null);

    if (!haxballAPIIframe) throw Error("Could not find API Iframe");

    // look for room url within frame
    const roomLinkTag = await haxballAPIIframe.waitForSelector("#roomlink a");

    const roomLink = await roomLinkTag!.getProperty("href");

    const roomLinkAsString: string = await roomLink.jsonValue();

    console.log(`${name} booted: ${roomLinkAsString}`);

    if (joinRoom)
      await this._joinRoom({ link: roomLinkAsString, name: joinName });

    return roomLinkAsString;
  }

  private async _joinRoom(roomLinkAndJoinName: {
    link: string;
    name?: string;
  }) {
    const { link, name } = roomLinkAndJoinName;
    const haxballPlayPage = await this._browser!.newPage();

    await haxballPlayPage.goto(link, {
      waitUntil: "networkidle2",
    });

    const haxballPlayPageIframe = haxballPlayPage
      .frames()
      .find((frame) => frame.parentFrame() !== null);

    if (!haxballPlayPageIframe)
      throw Error("Could not find haxball page Iframe");

    await haxballPlayPageIframe.waitForSelector("div.label-input input");
    await haxballPlayPageIframe.focus("div.label-input input");
    await haxballPlayPage.keyboard.type(name ? name : getRandomChars(6));

    await haxballPlayPageIframe.$eval("div.dialog button", (el) =>
      (el as HTMLButtonElement).click()
    );
  }

  private async _loadBrowser(isHeadless: boolean) {
    const browser = await Puppeteer.launch({
      headless: isHeadless,
      args: MINIMAL_ARGS,
    });
    this._browser = browser;
  }
}

const MINIMAL_ARGS = [
  "--autoplay-policy=user-gesture-required",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-client-side-phishing-detection",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-dev-shm-usage",
  "--disable-domain-reliability",
  "--disable-extensions",
  "--disable-features=AudioServiceOutOfProcess",
  "--disable-hang-monitor",
  "--disable-ipc-flooding-protection",
  "--disable-notifications",
  "--disable-offer-store-unmasked-wallet-cards",
  "--disable-popup-blocking",
  "--disable-print-preview",
  "--disable-prompt-on-repost",
  "--disable-renderer-backgrounding",
  "--disable-setuid-sandbox",
  "--disable-speech-api",
  "--disable-sync",
  "--hide-scrollbars",
  "--ignore-gpu-blacklist",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-default-browser-check",
  "--no-first-run",
  "--no-pings",
  "--no-sandbox",
  "--no-zygote",
  "--password-store=basic",
  "--use-gl=swiftshader",
  "--use-mock-keychain",
];
