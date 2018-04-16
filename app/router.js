const express = require('express')
const router = express.Router()

const apiRouters = require('./routes/api')
const webRouters = require('./routes/web')

router.use('/api', apiRouters)

router.all('*', webRouters)


module.exports = router;
