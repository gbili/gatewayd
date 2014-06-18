var request = require('request');
var gateway = require(__dirname +'/../../');
var restApiUrl = gateway.config.get('RIPPLE_REST_API');

/**
 *
 * @function getPaymentStatus
 * @description Calls ripple rest
 * @param url
 * @param fn
 */

module.exports = function(url, fn){
  request.get({url: url, json: true}, function(error,_,resp){
    if(error){
      fn(error, null);
    } else {
      if(resp.success) {
        fn(null, resp.payment);
      } else {
        fn(resp, null);
      }
    }
  });
};
