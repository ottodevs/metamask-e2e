import { setupMetamask, getBundledMetamaskInfo } from "metamask-puppeteer";
import * as Puppeteer from "puppeteer";
import { PuppeteerMetamask } from "metamask-puppeteer";
import { MetamaskCypressTasksHandler } from ".";
const fetch = require("node-fetch");

// cypress provides very low quality types for this case
export function metamaskCypressPlugin(on: any): void {
  /**
   * Add chrome args to:
   *  - be able to connect with puppeteer
   *  - load metamask extension
   */
  on("before:browser:launch", (browser: any = {}, args: any) => {
    if (browser.name === "chrome") {
      clearChromeCache();

      const bundledMetamaskInfo = getBundledMetamaskInfo();
      args.push(`--load-extension=${bundledMetamaskInfo.absPath}`);
      args.push("--remote-debugging-port=9222");

      // whatever you return here becomes the new args
      return args;
    }
  });

  let puppeteerSetup = false;
  let metamaskController: PuppeteerMetamask;

  on("task", {
    needsSetup: async () => {
      return !puppeteerSetup;
    },

    setupPuppeteer: async () => {
      const res = await fetch("http://localhost:9222/json/version");
      const config = await res.json();
      const webSocketDebuggerUrl = config.webSocketDebuggerUrl;

      const browser = await Puppeteer.connect({
        browserWSEndpoint: webSocketDebuggerUrl,
      });

      puppeteerSetup = true;
      metamaskController = await setupMetamask(browser);

      return true;
    },

    allowToConnect: async () => {
      // tslint:disable-next-line
      console.assert(puppeteerSetup);

      await metamaskController.allowToConnect();

      return true;
    },
  } as MetamaskCypressTasksHandler);
}
