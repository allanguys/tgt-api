const devices = require('puppeteer/DeviceDescriptors');
const puppeteer = require('puppeteer');
const { isString } = require('util');
const { chromePath } = require('../../config');
const URL = require('url');

const Result = require('../models/result');

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

  if (isString(url) && url.length > 10) {
    try {
      URL.parse(url);
    } catch (err) {
      return Promise.reject(new Error('url must be a valid URI.'));
    }
  } else {
    return Promise.reject(new Error('url must be string and valid URI.'));
  }

  const launchOptions = {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  };
  if (chromePath) {
    launchOptions.executablePath = chromePath;
  }

  // try {
  const browser = await puppeteer.launch(launchOptions);

  const page = await browser.newPage();
  await page.setRequestInterception(true);

  if (defaults.media && ['screen', 'print'].includes(defaults.media)) {
    await page.emulateMedia(defaults.media);
  }

  if (defaults.device) {
    let device = defaults.device.toLocaleLowerCase();
    if (['ios', 'iphone'].includes(device)) {
      defaults.device = 'iPhone X';
    } else if (device === 'android') {
      defaults.device = 'Nexus 7';
    } else if (device === 'wp') {
      defaults.device = 'Nokia Lumia 520';
    }
    device = devices[defaults.device];

    if (device) {
      await page.emulate(device);
    }
  }

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
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      const toUrl = frame.url();
      // skip login redirect
      if (toUrl.indexOf('/comm-htdocs/milo_mobile/login.html') > 0) return;

      if (toUrl !== url && toUrl !== 'about:blank') {
        if (toUrl.slice(0, -1) !== url && !defaults.followRedirect) {
          hasError = true;
          errMsg = `Stop follow redirec from "${url}" to "${toUrl}".`;
        } else {
          result.clear();
          result.addRedirect(toUrl);
          url = toUrl;
          result.setTimer('navigated', Date.now());
        }
      } else {
        result.setTimer('navigated', Date.now());
      }
    }
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
  await browser.close();
  // } catch (err) {
  //  errMsg = err.message || err;
  //  hasError = true;
  // }

  return hasError ? Promise.reject(new Error(errMsg)) : Promise.resolve(result);
}

const retryCrawler = async (url, defaults = {}) => {
  let isMobile = false;
  const options = defaults;

  if (options.device) {
    let device = options.device.toLocaleLowerCase();
    if (['ios', 'iphone'].includes(device)) {
      device = 'iPhone X';
    } else if (device === 'android') {
      device = 'Nexus 7';
    } else if (device === 'wp') {
      device = 'Nokia Lumia 520';
    }
    device = devices[device];

    if (device) {
      ({ isMobile } = device.viewport);
    }
  }

  try {
    return await crawler(url, options);
  } catch (err) {
    const e = err.message || err;
    if (e.indexOf('Stop follow redirec') >= 0) {
      options.device = isMobile ? 'default' : 'iPhone X';
      return crawler(url, options)
        .then(result => result)
        .catch((e2) => { const msg = e2.message || e2; throw new Error(msg); });
    }
    throw new Error(e);
  }
};

module.exports = retryCrawler;
