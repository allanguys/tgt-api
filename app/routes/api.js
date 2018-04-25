const { promisify, isObject }  = require('util');

const express = require('express');
const router = express.Router();
const { checker, crawler } = require('../handler')

function isURL(str) {
    var urlRegex = '^(?:(?:http|https)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
    var url = new RegExp(urlRegex, 'i');
    return str.length < 2083 && url.test(str);
}

router.post('/check', async (req, res) => {
    const url = req.body.url || '';
    let options = isObject(req.body.options) ? req.body.options : {};
    if(!isURL(url)) {
        res.json({msg: "url {"+url+"} must be a valid full address.", data: [req.headers, req.body]});
        return false;
    }

    try {
        const fetchResult = await crawler(url, options).catch(err => {
            res.json({msg: "Error: " + JSON.stringify(err)});
            return false;
        });
        const checkResult = await checker(fetchResult).catch(err => {
            res.json({msg: "Error: " + JSON.stringify(err)});
            return false;
        });

        res.json(checkResult);

    } catch (err) {
        res.json({msg: "Error: " + JSON.stringify(err)});
    }
});

router.post('/crawler', (req, res) => {
    const url = req.body.url || '';
    let options = isObject(req.body.options) ? req.body.options : {};
    if(!isURL(url)) {
        res.json({msg: "url {"+url+"} must be a valid full address.", data: [req.headers, req.body]});
        return false;
    }
    crawler(url, options).then(result => {
        res.json(result);
    }).catch(err => {
        res.json({ msg: err.message });
    });
});

module.exports = router;
