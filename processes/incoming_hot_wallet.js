var gateway = require(__dirname+'/../');

var Listener = require(__dirname+'/../lib/ripple/listener.js');

var listener = new Listener({
  account: gateway.config.get('HOT_WALLET').address
});

listener.onPayment = function(payment) {

  if (payment.destination_tag && (payment.result  == 'tesSUCCESS')){

    var rippleTransactionOptions = {
      destinationTag : payment.destination_tag,
      transaction_state : payment.result,
      amount: payment.destination_amount.value,
      currency: payment.destination_amount.currency,
      issuer = payment.destination_amount.issuer,
      state = 'incoming',
      hash : payment.hash
    };

    gateway.api.recordIncomingPayment(rippleTransactionOptions, function(error, record) {
      if (error) {
        console.log('error', error); 
      } else {
        try {
          console.log(record.toJSON()); 
        } catch(error) {
          console.log('error', error);
        }
      }
    });
  }
};

listener.start(gateway.config.get('HOT_WALLET').last_transaction_hash);

console.log('Listening for incoming ripple payments to the hot wallet.');

