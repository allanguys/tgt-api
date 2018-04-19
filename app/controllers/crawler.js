const devices = require('puppeteer/DeviceDescriptors');
const puppeteer = require('puppeteer');
const { isString } = require('util');
const config = require('../../config');

const Result = require('../models/result');

module.exports = async (url, options = {}) => {
    const defaults = {
        loadImages:false,
        loadMedias:false,
        logRequests: false,
        logConsole:false,
        device:false,
        media:"screen"
    };

    const result = new Result(url);

    const config = Object.assign({}, defaults, options);

    if(isString(url) && url.length > 10) {
        try {
            let _url = URL.parse(url)
        } catch (err) {
            return Promise.reject('url must be a valid URI.')
        }
    } else {
       return Promise.reject('url must be string and valid URI.')
    }

    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true);

    if(config.logRequests || !config.loadImages || !config.loadMedias) {
        page.on('request', async request => {
            if(config.logRequests) {

            }

            if(!config.loadImages && ( request.recourceType() === 'image' || request.resourceType() === 'font') ) {
                request.abort('aborted');
            } else if (!config.loadMedias && request.mediaType() === 'media') {
                request.abort('aborted');
            } else {
                request.continue();
            }
        });
    }


};
