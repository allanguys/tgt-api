
const crawler = require('./crawler');

/**
 * An async function for check if page has errors.
 * @method
 * @param fetchResult {object} 爬虫抓取返回的JSON结果
 * @return {Promise<any>}
 */
const checker = require('./checker');

module.exports = {
    checker,
    crawler
}
