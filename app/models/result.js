const { isObject } = require('util');

class Result {
    constructor(url) {
        this.url = url
        this.charset = ''
        this.html = ''
        this.headers = {}
        this.requests = {}
    }
    setRequest(key, val) {
        this.requests[key] = val
    }
}

module.exports = Result
