var gateway = require(__dirname+'/../');
var RippleAccountListener = require(__dirname+'/../lib/ripple/listener.js');
var IncomingPayment = require(__dirname+'/../lib/core/incoming_payment.js');
var rippleAccountListener = new RippleAccountListener();

rippleAccountListener.onPayment = function(payment) {
  var incomingPayment = new IncomingPayment(payment);
  console.log('INCOMING PAYMENT', payment);

  incomingPayment.checkDestinationTagValidity(function(isValidDestinationTag) {
    if (isValidDestinationTag) {
      incomingPayment.recordInDatabase('incoming', function(error, recordedPayment) {
        console.log('payment recorded in database');
      });
    } else {
      console.log('invalid destination tag', payment);
      incomingPayment.bounce(function(error, outgoingPayment) {
        console.log('payment bounced');
      });
    }
  });
};

rippleAccountListener.start(gateway.config.get('LAST_PAYMENT_HASH'));

