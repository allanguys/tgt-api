const { proCheck } = require('tgt-pkg');
const globalConfig = require('../../config');

function checkPing(pings) {
  const tcss = [];
  Object.keys(pings).forEach((r) => {
    if (r.indexOf('//pingfore.qq.com/pingd?dm') > 0) {
      tcss.push(r);
    }
  });
  return tcss;
}

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

  return proCheck(checkData).then(({ checkResult }) => {
    let result = checkResult;
    const { list, pageStandard, ignore } = checkResult;
    const size = list.length;
    const newList = [];
    if (pageStandard === 'true' && ignore !== 'all') {
      const tcss = checkPing(fetchResult.requests);
      const pingResult = {
        name: '点击流',
        error_id: 1001,
        error_info: tcss.length ? '' : '未检测到点击流上报，请检查页面中的统计脚本及相关代码',
        pass_info: tcss.length ? `点击流已上报，URL为：${tcss.join(', ')}` : '',
      };
      for (let i = 0; i < size; i += 1) {
        // eslint-disable-camelcase
        const { name, error_info } = list[i]; // eslint-disable-line camelcase
        if (name === '点击流' && !error_info) { // eslint-disable-line camelcase
          newList.push(pingResult);
        } else {
          newList.push(list[i]);
        }
      }
      result = Object.assign(checkResult, { list: newList });
    }

    return Promise.resolve(result);
  }).catch((err) => {
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

    return Promise.reject(new Error(msg));
  });
};

/**
 * An async function for check if page has errors.
 * @param {Object} fetchResult
 */
module.exports = checker;
