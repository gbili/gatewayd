var ripple = require(__dirname+'/../ripple/');
var config = require(__dirname+'/../../config/config.js');
var RippleRestClient = require('ripple-rest-client');
var uuid = require('node-uuid');

/**
 * @requires ripple, config
 *
 * @function refundColdWallet
 *
 * @descriptions Refunds cold wallet
 *
 * @param {String} currency
 * @param {Number} amount
 * @param {callback} callabck
 */

function refundColdWallet(currency, amount, callback){

  var rippleRestClient = new RippleRestClient({
    account: config.get('HOT_WALLET').address
  });

  var opts = {
    to_account: config.get('COLD_WALLET'),
    from_account: config.get('HOT_WALLET').address,
    amount: amount,
    currency: currency,
    issuer: config.get('COLD_WALLET'),
    secret: config.get('HOT_WALLET').secret
  };

  var options = {
    secret: config.get('HOT_WALLET').secret,
    client_resource_id: uuid.v4(),
    payment: {
      source_account: config.get('HOT_WALLET').address,
      destination_account: config.get('COLD_WALLET'),
      destination_amount: {
        value: amount.toString(),
        currency: currency,
        issuer: config.get('COLD_WALLET')
      },
      destination_tag: '0'
    }
  };

  rippleRestClient.sendAndConfirmPayment(options, callback);

}

module.exports = refundColdWallet;

