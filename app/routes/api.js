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

module.exports = router;
