const express = require('express')
const router = express.Router()
const fetch = require('../controllers/fetch')
const path = require('path')
const fs = require('fs')
const tgtPkg = require('tgt-pkg')

router.post('/fetch', (req, res) => {
    fetch(req, res).then(result => {
        res.json(result)
    }).catch(err => {
        res.json(err)
    })
})

router.post('/check', (req, res) => {
    //const result = await fetch(req, res)
    const filename = Date.now()
    const html = path.resolve(__dirname, '../../cache/'+filename+'.html');
    const json = path.resolve(__dirname, '../../cache/'+filename+'.json');
    fetch(req, res).then(result => {
        return new Promise((resolve, reject) => {
            fs.writeFile(html, result.html, "utf8", (err) => {
                if(err) {
                    reject(err);
                } else {
                    let jsonData = {log:{
                        ping: [],
                        images: [],
                        pages: [
                            {
                                id: result.url,
                                isbnLink: result.url
                            }
                        ],
                        nameList: "openApi"
                    }}
                    jsonData.charset = result.charset
                    jsonData.requests = result.requests
                    for(let link in jsonData.requests) {
                        if(link.indexOf('pingfore.qq.com/pingd?dm=') > -1 && link.indexOf('com&url') > -1) {
                            jsonData.log.ping.push(link)
                        }
                    }
                    fs.writeFile(json, JSON.stringify(jsonData), (err) => {
                        if(err) {
                            reject(err)
                        } else {
                            resolve(jsonData)
                        }
                    })
                }
            })
        })
    }).then((jsonData) => {
        console.log(jsonData)
        return new Promise((resolve, reject) => {
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
            }, resolve)
        })
    }).then((cb) => {
        console.log(cb.checkResult)
        res.json(cb.checkResult)
    }).catch(err => {
        res.json(err)
    })
})



router.get('/fetch', (req, res) => {
    res.send('必须使用 POST 方式提交请求！')
})

module.exports = router;
