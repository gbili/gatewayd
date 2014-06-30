var async = require('async');
var data = require(__dirname+'/../data/');

function retryFailedPayment(rippleTransactionId, callback){
  async.waterfall([
    function(next) {
      data.models.rippleTransactions.find({
        where: { id: rippleTransactionId }
      }).complete(next);
    },
    function(rippleTransaction, next) {
      if (rippleTransaction.state === 'failed') {
        rippleTransaction.updateAttributes({
          state: 'outgoing'
        }).complete(function(error, transaction) {
          next(error, transaction);
        });
      } else {
        next({ state: 'must be "failed"' });
      }
    }
  ], function(error, rippleTransaction) {
    if (error) {
      callback(error, null);
    } else {
      callback(null, rippleTransaction.toJSON());
    }
  });
}

module.exports = retryFailedPayment;

