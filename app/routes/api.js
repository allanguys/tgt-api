const { isObject } = require('util');
const express = require('express');

const router = express.Router();
const { checker, crawler } = require('../handler');

let errMsg = '';

function isURL(str) {
  const urlRegex = '^(?:(?:http|https)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
  const url = new RegExp(urlRegex, 'i');
  return str.length < 2083 && url.test(str);
}

router.post('/check', async (req, res) => {
  const url = req.body.url || '';
  const options = isObject(req.body.options) ? req.body.options : {};
  if (!isURL(url)) {
    res.json({ msg: `url {${url}} must be a valid full address.`, data: [req.headers, req.body] });
  } else {
    try {
      const fetchResult = await crawler(url, options);
      if (Object.keys(fetchResult).indexOf('msg') >= 0) {
        res.json(fetchResult);
      } else {
        const checkResult = await checker(fetchResult);
        if (options.withFetchResult) {
          checkResult.fetchResult = fetchResult;
        }
        res.json(checkResult);
      }
    } catch (err) {
      errMsg = err.message || err;
      res.json({ msg: `Error: ${errMsg}` });
    }
  }
});

router.post('/crawler', async (req, res) => {
  const url = req.body.url || '';
  const options = isObject(req.body.options) ? req.body.options : {};
  if (!isURL(url)) {
    res.json({ msg: `url {${url}} must be a valid full address.`, data: [req.headers, req.body] });
  }
  try {
    const fetchResult = await crawler(url, options);
    return res.json(fetchResult);
  } catch (err) {
    return res.json({ msg: err.message });
  }
});

module.exports = router;
