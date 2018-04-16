const express = require('express')
const router = require('./app/router')
const config = require('./config')

const app = express()
app.disable('x-powered-by')
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(express.static(__dirname+'/static', {immutable:true, maxAge:'1d'}))

app.use(router)

const port = process.env.PORT || config.port
const host = process.env.HOST || config.host

app.listen(port, host, () => {
    console.log('Server running at http://'+host+':'+port)
})
