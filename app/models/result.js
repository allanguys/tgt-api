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
  getHeader(key) {
    return this.headers[key] || null;
  }
  setHeader(key, val) {
    this.headers[key] = val;
  }
  setHeaders(headers) {
    this.headers = headers;
  }
  addRedirect(url) {
    this.redirects.push(url);
  }
  setRequest(url, status) {
    this.requests[url] = status;
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
  }
}

module.exports = Result;
