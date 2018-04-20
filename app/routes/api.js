const { promisify }  = require('util');

const express = require('express')
const router = express.Router()
const fetch = require('../controllers/fetch')
const path = require('path')
const fs = require('fs')
const tgtPkg = require('tgt-pkg')
const crawler = require('../controllers/crawler');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

router.post('/fetch', (req, res) => {
    fetch(req, res).then(result => {
        res.json(result)
    }).catch(err => {
        res.json(err)
    })
})

function isURL(str) {
    var urlRegex = '^(?:(?:http|https)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
    var url = new RegExp(urlRegex, 'i');
    return str.length < 2083 && url.test(str);
}

router.post('/check', async (req, res) => {
    try {
        const filename = Date.now()
        const html = path.resolve(__dirname, '../../cache/'+filename+'.html');
        const json = path.resolve(__dirname, '../../cache/'+filename+'.json');
        const result = await fetch(req, res);
        await writeFile(html, result.html, "utf8");
        let jsonData = {
            log:{
                ping: [],
                images: [],
                pages: [
                    {
                        id: result.url,
                        isbnLink: result.url
                    }
                ],
                nameList: "openApi"
            }
        };
        jsonData.charset = result.charset;
        jsonData.requests = result.requests;
        for(let link in jsonData.requests) {
            if(link.indexOf('pingfore.qq.com/pingd?dm=') > -1 && link.indexOf('com&url') > -1) {
                jsonData.log.ping.push(link)
            }
        }
        await writeFile(json, JSON.stringify(jsonData));
        tgtPkg.check({
            "config": {
                "isbnAPI": {
                    "host": "***REMOVED***",
                    "url": "http://***REMOVED***/isbn_api.php?url="
                }
            },
            "file": {
                "name": html,
                "charset": "utf8"
            },
            "request": {
                "name": json
            }
        }, cb => {
            console.log(cb);
            res.json(cb.checkResult);
        });
    } catch (err) {
        //const msg = err.message || err;
        console.log(err);
        res.send(JSON.stringify(err));
    }
});

router.post('/crawler', (req, res) => {
    const url = req.body.url || '';
    let options = isObject(req.body.options) ? req.body.options : {};
    if(!isURL(url)) {
        res.json({msg: "url must be a valid full address."});
    } else {
        crawler(url, options)
            .then(result => {
                res.json(result);
            }).catch(err => {
                res.json({ msg: err.message });
            });
    }
});

router.get('/fetch', (req, res) => {
    res.send('必须使用 POST 方式提交请求！');
});

module.exports = router;
