const { proCheck } = require('tgt-pkg');
const globalConfig = require('../../config');

/* function checkPing(pings) {
  const tcss = [];
  Object.keys(pings).forEach((r) => {
    if (r.indexOf('//pingfore.qq.com/pingd?dm') > 0 && r.indexOf('hot&url=') === -1) {
      tcss.push(r);
    }
  });
  return tcss;
} */

/**
 *
 * @param {object} fetchResult
 * @return {Promise<object>} checkResult
 */
const checker = async (fetchResult) => {
  const checkData = {
    config: {
      isbnAPI: {
        url: globalConfig.isbnApi,
      },
    },
    json: fetchResult,
  };
  try {
    const result = await proCheck(checkData);
    result.checkResult.fetchResult = fetchResult;
    return result;
  } catch (err) {
    // eslint-disable-next-line
    console.error(err);
    const errType = typeof err;
    let msg = 'Error';
    if (errType === 'string') {
      msg = err;
    }
    if (errType === 'object') {
      msg = err.message || err.toString();
    }

    throw new Error(msg);
  }
};

/**
 * An async function for check if page has errors.
 * @param {Object} fetchResult
 */
module.exports = checker;
