const { isString } = require('util')

const puppeteer = require('puppeteer')
const Result = require('../models/result')
const URL = require('url')

//const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
async function fetch(req, res) {
    return new Promise(async (resolve, reject) => {
        const url = req.body.url || false
        const hosts = req.body.hosts || false
        const loadImages = req.body.loadImages || false
        const loadMedias = req.body.loadMedias || false

        if(isString(url) && url.length > 14) {
            try {
                let _url = URL.parse(url)
            } catch (err) {
                reject('url must be a valid URI.')
            }
        } else {
           reject('url must be string and valid URI.')
        }

        let result = new Result(url)
        const browser = await puppeteer.launch({
            timeout: 15000,
            ignoreHTTPSErrors: true
        })
        const page = await browser.newPage()
        //await page.tracing.start({path: 'trace.json', categories: ['devtools.timeline']})
        page.setRequestInterception(true)
        page.on('error', (err) => {
            console.log(err)
            reject(err.message || '')
        })
        page.on('request', ri => {
            if(ri.url().trimRight('/') === url.trimRight('/')) {
                ri.continue({
                    //url: ri.url().replace('lol.qq.com', '10.205.2.217'),
                    //headers:{"Host":"lol.qq.com"}
                })
            } else {
                result.setRequest(ri.url(), '')
                if (loadImages === false && ri.resourceType() === 'image') {
                    ri.abort('aborted') // 取消图片请求，而且响应状态能识别是取消
                    result.setRequest(ri.url(), 'aborted')
                } else if (loadMedias === false && ri.resourceType() === 'media') {
                    ri.abort('aborted')
                    result.setRequest(ri.url(), 'aborted')
                } else {
                    ri.continue()
                }
            }
        })
        page.on('response', res => {
            if(res.url().trimRight('/') === url.trimRight('/')) {
                result.headers = res.headers()
            } else {
                result.setRequest(res.url(), res.status())
            }

            // res.url(): 对应 ri.url()
            // res.headers(): 获得响应头信息
            // res.ok(): 响应状态码是否为 200 - 299
            // res.status(): 响应状态码
            // res.text(): 响应内容
        })
        await page.goto(url)
        result.html = await page.content()
        result.charset = await page.evaluate(()=>{
            return document.charset;
        })
        await browser.close()
        resolve(result)
    })
}

module.exports = fetch
