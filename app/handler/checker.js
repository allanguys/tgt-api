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
    const { checkResult } = await proCheck(checkData);
    let result = checkResult;
    const { list, pageStandard, ignore } = checkResult;
    const size = list.length;
    const newList = [];
    if (pageStandard === 'true' && ignore !== 'all' && ignore.indexOf('charset') < 0) {
      const charsetResult = {
        name: '编码',
        error_id: 2004,
        error_info: fetchResult.charset ? '' : '响应头信息与页面中均未指定页面编码，可能会造成页面显示乱码。',
        pass_info: fetchResult.charset ? `检测到页面的编码声明为：${fetchResult.charset}` : '',
      };
      for (let i = 0; i < size; i += 1) {
        // eslint-disable-camelcase
        const { name, error_id } = list[i]; // eslint-disable-line camelcase
        if (name === '编码' || error_id === 2004) { // eslint-disable-line camelcase
          newList.push(charsetResult);
        } else {
          newList.push(list[i]);
        }
      }
      result = Object.assign(checkResult, { list: newList });
    }

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
