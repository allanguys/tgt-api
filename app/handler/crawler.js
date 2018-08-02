/* global window */
/* eslint no-console:0 */
const devices = require('puppeteer/DeviceDescriptors');
const puppeteer = require('puppeteer');
const { isString } = require('util');
const { chrome } = require('../../config');
const URL = require('url');

const Result = require('../models/result');

const pcDevice = {
  name: 'default',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.170 Safari/537.36',
  viewport: {
    width: 1400,
    height: 900,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    isLandscape: true,
  },
};

function isValidUrl(url) {
  if (isString(url) && url.length > 10) {
    try {
      const parsedUrl = URL.parse(url, false, true);
      if (parsedUrl.host) {
        return true;
      }
    } catch (err) {
      return false;
    }
  }
  return false;
}

function checkDevice(defaults) {
  let isMobile = false;
  let deviceName = 'default';
  let device = pcDevice;
  if (defaults.device) {
    deviceName = defaults.device;
    if (['ios', 'iphone'].includes(deviceName.toLocaleLowerCase())) {
      deviceName = 'iPhone X';
    } else if (deviceName === 'android') {
      deviceName = 'Nexus 7';
    } else if (['wp', 'windows phone'].includes(deviceName.toLocaleLowerCase())) {
      deviceName = 'Nokia Lumia 520';
    }
    device = devices[deviceName] || false;

    if (device) {
      ({ isMobile } = device.viewport);
    } else {
      device = pcDevice;
    }
  }

  return { isMobile, device };
}

async function crawler(startUrl, options = {}) {
  let defaults = {
    loadImages: false,
    loadMedias: false,
    logRequests: true,
    logConsole: false,
    logHtml: true,
    followRedirect: true,
    device: 'default',
    media: 'screen',
  };
  let url = startUrl;
  const result = new Result(url);
  defaults = Object.assign({}, defaults, options);
  let errMsg = '';
  let hasError = false;

  if (!isValidUrl(url)) {
    return Promise.reject(new Error('url must be a valid URI.'));
  }

  const urlParts = url.split('/');
  if (urlParts.length < 4) {
    url += '/';
  }

  const launchOptions = {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  };

  if (chrome) {
    launchOptions.executablePath = chrome;
  }

  try {
    const browser = await puppeteer.launch(launchOptions);
    result.browser = await browser.version();

    const page = await browser.newPage();
    await page.setRequestInterception(true);

    if (defaults.media && ['screen', 'print'].includes(defaults.media)) {
      await page.emulateMedia(defaults.media);
    }

    let { isMobile, device } = checkDevice(defaults);

    await page.emulate(device);

    // log console messages
    if (defaults.logConsole) {
      page.on('console', (consoleMessage) => {
        result.addConsole(consoleMessage.type(), consoleMessage.text());
      });
    }

    page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });

    // log dom ready time
    page.on('domcontentloaded', () => {
      result.setTimer('domContentLoaded', Date.now());
    });

    page.on('error', async (err) => {
      hasError = true;
      errMsg = `Page error. ${err.message}`;
      console.log(errMsg);
      await browser.close();
    });

    page.on('pageerror', (err) => {
      result.addError(err.message);
    });

    // check and log redirect
    /* page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        const toUrl = frame.url();
        if (toUrl !== url && toUrl !== 'about:blank') {
          if (!defaults.followRedirect) {
            hasError = true;
            errMsg = `Stop follow redirec from "${url}" to "${toUrl}".`;
          } else {
            result.clear();
            result.addRedirect(toUrl);
            url = toUrl;
          }
        } else {
          result.setTimer('navigated', Date.now());
        }
      }
    }); */

    page.on('response', (res) => {
      if (res.url() === url && res.headers()) {
        // hasError = true;
        // errMsg = `Main Request Error (${res.status()}).`;
        result.setHeaders(res.headers());
        const contentType = res.headers()['content-type'] || '';
        const match = contentType.match(/charset=([a-zA-Z0-9_-]+)/i);
        result.charset = (match && match.length >= 2) ? match[1] : '';
      }
    });

    page.on('load', () => {
      result.setTimer('load', Date.now());
    });

    page.on('request', (req) => {
      if (req.isNavigationRequest() && req.url() !== url && !defaults.followRedirect) {
        req.abort('aborted');
      } else {
        const type = req.resourceType();
        if (req.url() === url) {
          result.setTimer('request', Date.now());
        }
        if (defaults.logRequests) {
          result.setRequest(req.url(), '100');
        }
        if (type === 'image' && !defaults.loadImages) {
          if (defaults.logRequests) {
            result.setRequest(req.url(), 'Aborted');
          }
          req.abort('aborted');
        } else if (type === 'media' && !defaults.loadMedias) {
          if (defaults.logRequests) {
            result.setRequest(req.url(), 'Aborted');
          }
          req.abort('aborted');
        } else {
          req.continue();
        }
      }
    });

    page.on('requestfinished', async (req) => {
      try {
        if (req.url() === url) {
          if (req.response() && req.response().status() && req.response().status() === 404) {
            hasError = true;
            errMsg = `Page not found. [ ${req.url()}: ${req.response().status()} ]`;
          } else {
            result.setTimer('requestfinished', Date.now());
            result.setHeaders(req.response().headers());
            const contentType = req.response().headers()['content-type'] || '';
            const match = contentType.match(/charset=([a-zA-Z0-9_-]+)/i);
            result.charset = (match && match.length >= 2) ? match[1] : '';
          }
        }
        if (defaults.logRequests) {
          result.setRequest(req.url(), req.response().status());
        }
      } catch (err) {
        throw (err);
      }
    });

    page.on('requestfailed', async (req) => {
      if (req.url() === url && req.failure().errorText !== 'net::ERR_ABORTED') {
        hasError = true;
        errMsg = `Request failed. [ ${req.url()}: ${req.failure().errorText} ]`;
        result.setTimer('requestfailed', Date.now());
      }
      if (req.response()) {
        result.setRequest(req.url(), req.response().status());
      }
    });

    result.setTimer('start', Date.now());
    await page.goto(url, {
      timeout: 15000,
      waitUntil: 'networkidle2',
    });
    const html = await page.content();
    if (defaults.logHtml) {
      result.html = html;
    }
    if (result.charset === '') {
      const match = html.match(/<meta[^>]+charset=["']?([a-zA-Z0-9_-]+)['";]*>/i);
      result.charset = (match && match.length >= 2) ? match[1] : '';
    }

    result.url = url;
    result.userAgent = await page.evaluate(() => Promise.resolve(window.navigator.userAgent));
    await browser.close();

    return hasError ? Promise.reject(new Error(errMsg)) : Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

module.exports = crawler;
