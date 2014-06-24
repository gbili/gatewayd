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
            pollPaymentStatus(statusUrl, function(error, payment){
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

/**
 *
 * @function getAndHandlePaymentStatus
 * @param statusUrl
 * @param callback
 * @param loopFunction
 *
 * @description Call this function in a loop, passing in itself as the loopFunction.
 * It will call Ripple REST for the status of a payment, and loop if
 * the state is not "validated"
 *
 */

function getAndHandlePaymentStatus(statusUrl, callback, loopFunction){
  console.log('getAndHandlePaymentStatus');
  getPaymentStatus(statusUrl, function(error, payment){
    console.log('got payment status');
    if (error) {
      console.log('ERROR', error);
      callback(error, null);
      loopFunction(statusUrl, callback, loopFunction);
    } else {
      console.log('getPaymentStatus::', payment);
      if (payment.state == 'validated'){
        callback(null, payment);
      } else {
        loopFunction(statusUrl, callback, loopFunction);
      }
    }
  });
}

/**
 * @function pollPaymentStatus
 * @description Upon successfully posting a payment to Ripple REST
 * use the client_resource_id and status url provided to poll for
 * the payment's status and validate its state in the Rippled ledger.
 *
 * The pollPaymentStatus function calls a single looping function,
 * passing in the callback and looping function as parameters
 * @param {string} statusUrl
 * @param {function} callback
 * @returns {Payment}
 */
function pollPaymentStatus(statusUrl, callback){
  getAndHandlePaymentStatus(statusUrl, callback, getAndHandlePaymentStatus);
}

/**
 * @function performOutgoingPaymentJob
 *
 * Read a single ripple transaction with state of "outgoing"
 * from the database, process it by sending the payment to
 * Ripple REST. Upon response from Ripple REST record the payment
 * state in the database and poll Ripple REST for the status
 * of the payment. Finally record the transaction_state and
 * ripple transaction_hash from the ledger.
 *
 * Loops infinitely by calling itself.
 */

console.log('Sending outgoing ripple payments from the queue to Ripple REST.');

