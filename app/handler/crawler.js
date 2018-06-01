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
  let retried = false;

  if (!isValidUrl(url)) {
    return Promise.reject(new Error('url must be a valid URI.'));
  }

  const urlParts = url.split('/');
  if (urlParts.length < 4) {
    url += '/';
  }

  const launchOptions = {
    timeout: 5000,
    ignoreHTTPSErrors: true,
    args: [
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  };

  if (chrome) {
    launchOptions.executablePath = chrome;
  }

  // try {
  const browser = await puppeteer.launch(launchOptions);
  result.browser = await browser.version();

  const page = await browser.newPage();
  await page.setRequestInterception(true);

  function handleClose(msg) {
    console.log(msg);
    page.close();
    browser.close();
    process.exit(1);
  }

  process.on('uncaughtException', () => {
    handleClose('Crashed');
  });

  process.on('uncaughtRejection', () => {
    handleClose('Crashed');
  });

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
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      const toUrl = frame.url();
      if (toUrl !== url && toUrl !== 'about:blank') {
        if (!defaults.followRedirect) {
          if (!retried) {
            // change device and retry
            result.clear();
            result.redirects = [url];
            device = isMobile ? pcDevice : devices['iPhone X'];
            console.warn('retied with', device.userAgent);
            isMobile = !isMobile;
            retried = true;
            return Promise.all([
              page.emulate(device),
              page.goto(url, {
                timeout: 10000,
                waitUntil: ['networkidle2', 'load'],
              }),
            ]);
          }
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
    return Promise.resolve();
  });

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
    // Stop login redirect
    if (req.url().indexOf('//login.game.qq.com/comm-cgi-bin/login') > 0 ||
        req.url().indexOf('/comm-htdocs/milo_mobile/login.html') > 0) {
      req.respond({
        status: '200',
        contentType: 'text/plain',
        body: '',
      });
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
        result.setTimer('requestfinished', Date.now());
        result.setHeaders(req.response().headers());
        const contentType = req.response().headers()['content-type'] || '';
        const match = contentType.match(/charset=([a-zA-Z0-9_-]+)/i);
        result.charset = (match && match.length >= 2) ? match[1] : '';
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
    timeout: 10000,
    waitUntil: 'networkidle0',
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

  setTimeout(handleClose, 1000);

  return hasError ? Promise.reject(new Error(errMsg)) : Promise.resolve(result);
}

module.exports = crawler;
