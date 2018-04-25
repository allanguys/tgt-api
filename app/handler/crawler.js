const devices = require('puppeteer/DeviceDescriptors');
const puppeteer = require('puppeteer');
const { isString } = require('util');
const config = require('../../config');
const URL = require('url');

const Result = require('../models/result');

module.exports = async (url, options = {}) => {
    const defaults = {
        loadImages:false,
        loadMedias:false,
        logRequests: true,
        logConsole:true,
        logHtml: false,
        followRedirect: true,
        device:"default",
        media:"screen",

    };
    const result = new Result(url);
    const config = Object.assign({}, defaults, options);
    let cancelFlag = false;
    let errMsg = '';
    let hasError = false;

    if(isString(url) && url.length > 10) {
        try {
            let _url = URL.parse(url)
        } catch (err) {
            return Promise.reject('url must be a valid URI.')
        }
    } else {
        return Promise.reject('url must be string and valid URI.')
    }

    const launchOptions = {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    };
    if(config.chromePath) {
        launchOptions.executablePath = config.chromePath;
    }
    const browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.setRequestInterception(true);

    if(config.media && ['screen', 'print'].includes(config.media)) {
        await page.emulateMedia(config.media);
    }

    if(config.device) {
        let device = config.device.toLocaleLowerCase();
        if(["ios", "iphone"].includes(device)) {
            config.device = "iPhone X";
        } else if(device === "android") {
            config.device = "Nexus 7";
        } else if(device === "wp") {
            config.device = "Nokia Lumia 520";
        }
        device = devices[config.device];

        if(device) {
            await page.emulate(device);
        }
    }

    // log console messages
    if(config.logConsole) {
        page.on('console', consoleMessage => {
            result.addConsole(consoleMessage.type(), consoleMessage.text());
        });
    }

    // log dom ready time
    page.on('domcontentloaded', () => {
        result.setTimer('domContentLoaded', Date.now());
    });

    page.on('error', err => {
        hasError = true;
        errMsg = `Page error. ${err.message}`;
    });

    page.on('pageerror', err => {
        result.addError(err.message);
    });

    // check and log redirect
    page.on('framenavigated', frame => {
        if(frame === page.mainFrame()) {
            const _url = frame.url();
            if(_url !== url && _url !== 'about:blank') {
                if(_url.slice(0, -1) !== url && !config.followRedirect) {
                    hasError = true;
                    errMsg = `Stop follow redirec from "${url}" to "${_url}".`;
                } else {
                    result.clear();
                    result.addRedirect(_url);
                    url = _url;
                    result.setTimer('navigated',Date.now());
                }
            } else {
                result.setTimer('navigated',Date.now());
            }
        }
    });

    page.on('response', res => {
        if(res.url() === url && !res.ok()) {
            hasError = true;
            errMsg = `Main Request Error (${res.status()}).`
        }
    });

    page.on('load', () => {
        result.setTimer('load', Date.now());
    });

    page.on('request', req => {
        if(hasError) {
            req.abort();
        } else {
            const type = req.resourceType();
            if(req.url() === url) {
                result.setTimer('request', Date.now());
            }
            if(config.logRequests) {
                result.setRequest(req.url(), '100');
            }
            if(type === 'image' && !config.loadImages) {
                if(config.logRequests) {
                    result.setRequest(req.url(), 'Aborted');
                }
                req.abort('aborted');
            } else if(type === 'media' && !config.loadMedias) {
                if(config.logRequests) {
                    result.setRequest(req.url(), 'Aborted');
                }
                req.abort('aborted');
            } else {
                req.continue();
            }
        }
    });

    page.on('requestfinished', async req => {
        if(req.url() === url) {
            result.setTimer('requestfinished', Date.now());
            if(req.response().ok() === false) {
                cancelFlag = true;
                errMsg = `Request Failed. [ ${url}: ${req.response().status()}`;
            } else {
                result.setHeaders(req.response().headers());
                const contentType = req.response().headers().contentType || '';
                const match = contentType.match(/charset=([a-z0-9_\-]+)/i);
                if(match && match.length > 2) {
                    result.charset = match[1];
                }
            }
        }
        if(config.logRequests) {
            result.setRequest(req.url(), req.response().status());
        }
    });

    page.on('requestfailed', async req => {
        if(req.url() === url) {
            hasError = true;
            errMsg = `Request failed.`
            result.setTimer('requestfailed', Date.now());
        }
        if(req.response()) {
            result.setRequest(req.url(), req.response().status());
        }
    });

    result.setTimer('start', Date.now());
    const res = await page.goto(url, {
        timeout: 15000,
        waitUntil: 'networkidle2'
    });

    if(result.charset === '' && res.ok()) {
        result.charset = await page.evaluate(() => {
            let meta = document.querySelector('meta[charset]');
            if(meta) {
                return meta.getAttribute('charset') || '';
            } else {
                meta = document.querySelector('meta[http-equiv=content-type]');
                if(meta) {
                    const contentType = meta.getAttribute('content') || '';
                    const match = contentType.match(/charset=([a-z0-9_\-]+)/i);
                    return match && match.length > 2 ? match[1] : '';
                }
            }
            return '';
        });
    }
    if(!config.noHtml) {
        result.html = await page.content();
    }

    result.url = page.url();
    await browser.close();

    if(hasError) {
        throw new Error(errMsg);
    } else {
        return Promise.resolve(result);
    }
};
