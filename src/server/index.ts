import puppeteer from "puppeteer";

const HAXBALL_HEADLESS_URL = "https://www.haxball.com/headless";

(async () => {
  const IS_HEADLESS = false;

  const browser = await puppeteer.launch({ headless: IS_HEADLESS });

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

  // look for room url within frame
  const roomLinkTag = await haxballAPIIframe.waitForSelector("#roomlink a");
  const roomLink = await roomLinkTag.getProperty("href");
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
  await haxballPlayPageIframe.waitForSelector("div.label-input input");
  await haxballPlayPageIframe.focus("div.label-input input");
  await haxballPlayPage.keyboard.type(playerName);

  await haxballPlayPageIframe.$eval(
    "div.dialog button",
    (el: HTMLButtonElement) => el.click()
  );
}
