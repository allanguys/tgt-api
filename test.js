const puppeteer = require('puppeteer');
const fs = require('fs');
const util = require('util');

let url = process.argv[2] || "http://tps.qq.com/";

puppeteer.launch().then(async browser => {
    const page = await browser.newPage();
    let requests = {};
    let consoles = {};
    let timer = {};
    let canceled = false;
    let startTime = 0;
    const followRedirect = true;
    let redirectChain = [url];
    page.setRequestInterception(true);
    page
        .on('console', cm => {
            consoles[cm.type()] = consoles[cm.type()] || [];
            consoles[cm.type()].push(cm.text());
        })
        // .on('dialog', dialog => console.log('dialog', dialog))
        .on('domcontentloaded', () => {
            timer.domContentLoaded = Date.now() - startTime;
        })
        // .on('error', err => console.log('error', err))
        .on('frameattached', frame => console.log('frameattached', frame.url()))
        .on('framedetached', frame => console.log('framedetached', frame.url()))
        .on('framenavigated', async frame => {
            const _url = frame.url();
            if(frame === page.mainFrame() && _url !== url && _url !== 'about:blank') {
                if(_url.slice(0, -1) !== url && !followRedirect) {
                    console.warn(url+'重定向到'+_url+'，取消操作');
                    canceled = true;
                    try {
                        await browser.close();
                        process.exit(0);
                    } catch (err) {
                        process.exit(1);
                    }
                } else {
                    redirectChain.push(_url);
                    url = _url;
                    timer = {};
                    requests = {};
                    consoles = {};
                    timer.navigated = Date.now() - startTime;
                }
            } else {
                timer.navigated = Date.now() - startTime;
            }
        })
        .on('load', () => {
            timer.pageLoad = Date.now() - startTime;
        })
        // .on('metrics', obj => console.log('metrics', obj))
        // .on('pageerror', err => console.log('page error', err))
        .on('request', req => {
            if(req.url() === url) {
                timer.request = Date.now() - startTime;
            }
            requests[req.url()] = "...";
            req.continue();
            //console.log('request', req)
        })
        .on('requestfinished', async req => {
            if(req.url() === url) {
                timer.requestFinished = Date.now() - startTime;
                if(req.response().ok() === false) {
                    console.warn(url+' 请求失败：'+req.response().status());
                    canceled = true;
                    try {
                        await browser.close();
                        process.exit(0);
                    } catch (err) {
                        process.exit(1);
                    }
                }
            }
            requests[req.url()] = req.response().status();
        })
        .on('requestfailed', req => console.log('request failed', req));

    startTime = Date.now();
    const res = await page.goto(url, {
        timeout: 15000,
        waitUntil: 'networkidle2'
    });
    const charset = await page.evaluate(() => {
        return document.charset;
    });
    const pageHtml = await page.content();
    const resHtml = await res.text();

    if(!canceled) {
        console.log({
             url: page.url(),
             charset,
             headers: await res.headers(),
             redirects: redirectChain,
             requests,
             timer,
             consoles,
        //     html
        });
        await browser.close();
    }

}).catch(err => {
    if(err.message.indexOf('Target closed.') < 0) {
        console.log(err);
        process.exit(1);
    }
});
