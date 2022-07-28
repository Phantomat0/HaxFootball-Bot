import puppeteer from "puppeteer";

const HAXBALL_HEADLESS_URL = "https://www.haxball.com/headless";

const IS_HEADLESS = true;

const minimal_args = [
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

(async () => {
  const browser = await puppeteer.launch({
    headless: IS_HEADLESS,
    args: minimal_args,
  });

  const roomLink = await loadRoomAndGetURL(browser);

  if (IS_HEADLESS) return;
  await joinRoom(browser, roomLink, "NIPSEY HUSSLE");
})();

async function loadRoomAndGetURL(browser: puppeteer.Browser): Promise<string> {
  const haxballAPIPage = (await browser.pages())[0];

  await haxballAPIPage.goto(HAXBALL_HEADLESS_URL, {
    waitUntil: "networkidle2",
  });

  await haxballAPIPage.addScriptTag({ path: "dist/room-bundle.js" });

  const haxballAPIIframe = haxballAPIPage
    .frames()
    .find((frame) => frame.parentFrame() !== null);

  if (!haxballAPIIframe) throw Error("Could not find API Iframe");

  // look for room url within frame
  const roomLinkTag = await haxballAPIIframe.waitForSelector("#roomlink a");

  const roomLink = await roomLinkTag!.getProperty("href");
  return await roomLink.jsonValue();
}

async function joinRoom(
  browser: puppeteer.Browser,
  roomLink: string,
  playerName: string
) {
  const haxballPlayPage = await browser.newPage();

  await haxballPlayPage.goto(roomLink, {
    waitUntil: "networkidle2",
  });

  const haxballPlayPageIframe = haxballPlayPage
    .frames()
    .find((frame) => frame.parentFrame() !== null);

  if (!haxballPlayPageIframe) throw Error("Could not find haxball page Iframe");

  await haxballPlayPageIframe.waitForSelector("div.label-input input");
  await haxballPlayPageIframe.focus("div.label-input input");
  await haxballPlayPage.keyboard.type(playerName);

  await haxballPlayPageIframe.$eval("div.dialog button", (el) =>
    (el as HTMLButtonElement).click()
  );
}
