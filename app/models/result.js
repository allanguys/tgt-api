class Result {
    constructor(url) {
        this._charset = '';
        this._consoles = {};
        this._errors = [];
        this._headers = {};
        this._html = '';
        this._redirects = [url];
        this._requests = {};
        this._start = Date.now();
        this._timer = {
            start: new Date(this._start)
        };
        this._url = url;
    }

    get charset() {
        return this._charset;
    }
    set charset(val) {
        this._charset = val;
    }
    get consoles() {
        return this._consoles;
    }
    get errors() {
        return this._errors;
    }
    get headers() {
        return this._headers;
    }
    get html() {
        return this._html;
    }
    set html(content) {
        this._html = content;
    }
    get requests() {
        return this._requests;
    }
    get timer() {
        return this._timer;
    }
    get url() {
        return this._url;
    }
    set url(val) {
        this._url = val;
    }

    /**
     *
     * @param {string} type
     * @param {string} line
     */
    addConsole(type, line) {
        this._consoles[type] = this._consoles[type] || [];
        this._consoles[type].push(line);
    }

    addError(errMessage) {
        this._errors.push(errMessage);
    }
    getHeader(key) {
        return this._headers[key] || null
    }
    setHeader(key, val) {
        this._headers[key] = val;
    }
    setHeaders(headers) {
        this._headers = headers;
    }
    addRedirect(url) {
        this._redirects.push(url);
    }
    setRequest(url, status) {
        this._requests[url] = status
    }
    /**
     *
     * @param {string} event
     * @param {number} millionSecond
     */
    setTimer(event, millionSecond) {
        if(event === 'start') {
            this._start = millionSecond;
            this._timer.start = new Date(millionSecond).toISOString();
        } else {
            this._timer[event] = millionSecond - this._start;
        }
    }
    toJSON() {
        let result = {}
        for(let k in this) {
            if(k !== '_start') {
                result[k.slice(1)] = this[k];
            }
        }
        return result;
    }
    clear() {
        this._consoles = {};
        this._headers = {};
        this._requests = {};
    }
}

module.exports = Result
