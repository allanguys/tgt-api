class Result {
  constructor(url) {
    this.charset = '';
    this.consoles = {};
    this.errors = [];
    this.headers = {};
    this.html = '';
    this.redirects = [url];
    this.requests = {};
    this.start = Date.now();
    this.timer = {
      start: new Date(this.start),
    };
    this.url = url;
    this.browser = '';
    this.userAgent = '';
  }

  /**
     *
     * @param {string} type
     * @param {string} line
     */
  addConsole(type, line) {
    this.consoles[type] = this.consoles[type] || [];
    this.consoles[type].push(line);
  }

  addError(errMessage) {
    this.errors.push(errMessage);
  }

  addRedirect(url) {
    this.redirects.push(url);
  }

  getHeader(key) {
    return this.headers[key] || null;
  }

  ignoreRequest(url) {
    if (url.indexOf('//btrace.video.qq.com/') > 0) {
      return true;
    }
    if (url.indexOf('//pingfore.qq.com/pingd?') > 0 && url.indexOf('.hot&url=') > 0) {
      return true;
    }
    return false;
  }

  setHeader(key, val) {
    this.headers[key] = val;
  }
  setHeaders(headers) {
    this.headers = headers;
  }

  setRequest(url, status) {
    if (!this.ignoreRequest(url)) {
      this.requests[url] = status;
    }
  }
  /**
     *
     * @param {string} event
     * @param {number} millionSecond
     */
  setTimer(event, millionSecond) {
    if (event === 'start') {
      this.start = millionSecond;
      this.timer.start = new Date(millionSecond).toISOString();
    } else {
      this.timer[event] = millionSecond - this.start;
    }
  }

  clear() {
    this.consoles = {};
    this.headers = {};
    this.requests = {};
    this.errors = [];
    this.charset = '';
    this.start = Date.now();
  }
}

module.exports = Result;
