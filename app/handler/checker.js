const { proCheck } = require('tgt-pkg');
const globalConfig = require('../../config');

/**
 *
 * @param {object} fetchResult
 * @return {Promise<object>} checkResult
 */
const checker = async fetchResult => {
    checkData = {
        config: {
            isbnAPI: {
                url: globalConfig.isbnApi
            }
        },
        json: fetchResult
    };

    return proCheck(checkData).then(cb => {
        return Promise.resolve(cb.checkResult);
    }).catch(err => {
        console.error()
        const _type = typeof err;
        let msg = "Error";
        if(_type === 'string') {
            msg = err;
        }
        if(_type === object) {
            msg = err.message || err.toString();
        }

        return Promise.reject(new Error(msg));
    });

}

/**
 * An async function for check if page has errors.
 * @param {Object} fetchResult
 */
module.exports = checker;
