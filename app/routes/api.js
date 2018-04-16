const express = require('express')
const router = express.Router()
const fetch = require('../controllers/fetch')

router.post('/fetch', (req, res) => {
    fetch(req, res).then(result => {
        res.json(result)
    }).catch(err => {
        res.json(err)
    })
})

router.get('/fetch', (req, res) => {
    res.send('必须使用 POST 方式提交请求！')
})

module.exports = router;
