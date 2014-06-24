var sendPayment = require(__dirname + '/../ripple/send_payment');
var buildPayment = require(__dirname + '/../ripple/build_payment');
var getPaymentStatus = require(__dirname + '/../ripple/get_payment_status');
var depositCallbackJob = require(__dirname+'/../jobs/deposit_completion_callback.js');
var gateway = require(__dirname+'/../../');
process.env.DATABASE_URL = gateway.config.get('DATABASE_URL');

function OutgoingPaymentProcessor(payment) {
  this.outgoingPayment = payment;
}

OutgoingPaymentProcessor.prototype = {

  processOutgoingPayment: function(callback) {
    var self = this;
    var transaction = self.outgoingPayment;
    gateway.data.rippleAddresses.read(transaction.to_address_id, function(err, address) {
      processOutgoingPayment(transaction, address, function(err, resp){
        if (err) {
          switch(err)
          {
            case 'retry':
              transaction.state = 'outgoing';
              break;
            case 'noPathFound':
              transaction.state = 'failed';
              break;
            default:
              transaction.state = 'failed';
          }
          transaction.save().complete(function(){
            depositCallbackJob.perform([transaction.id], console.log);
            callback();
          }); 
        } else {
          var statusUrl = resp.status_url;
          transaction.state = 'sent';
          transaction.uid = resp.client_resource_id;
          transaction.save().complete(function(){
            rippleRestClient.pollPaymentStatus(statusUrl, function(error, payment){
              if (error) {
                throw new Error(error);
              }
              
              transaction.transaction_state = payment.result;
              transaction.transaction_hash = payment.hash;
              switch(payment.result) {
              case 'tesSUCCESS':
                transaction.state = 'succeeded';
                break;
              default:
                transcation.state = 'failed';
              }
              transaction.save().complete(function(){
                depositCallbackJob.perform([transaction.id], console.log);
                callback();
              });
            });
          });
        }
      });
    });
  
  }  

};

module.exports = OutgoingPaymentProcessor;


/**
 * @function processOutgoingPayment
 * @description Process queued outgoing payments by calling
 * Ripple REST to construct and post a payment.
 *
 * @param transaction
 * @param address
 * @param fn
 *
 */

function processOutgoingPayment(transaction, address, fn){

  buildPayment(transaction, address, function(err, payment) {
    if (err) { handleError(err, fn); return; }
    sendPayment(payment, function(err, resp){
      if (err || !resp.success) {
        handleError(err, fn);
      } else {
        fn(null, resp);
      }
    });
  });

  function handleError(error, fn) {
    if (typeof error === 'string' && error.match('No paths found')){
      fn('noPathFound', null);
    } else if (error) {
      fn(error, null);
    } else {
      fn('retry', null);
    }
  }
}

console.log('Sending outgoing ripple payments from the queue to Ripple REST using the hot wallet.');

