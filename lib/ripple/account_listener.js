var util = require("util");
var EventEmitter = require("events").EventEmitter;
var Client = require('ripple-rest-client');
var gateway = require(__dirname+'/../../');

var vent = new EventEmitter();

RippleAccountListener.prototype.pollForPayments = function(hash, callback) {

  client.getNotification(hash, function(err, notification) {

    if (err) {
      setTimeout(function(){
        callback(hash, callback);
      },500);
      return;
    }
    if (notification && notification.next_notification_hash) {
      client.getPayment(notification.next_notification_hash, function(err, payment) {
        if (err) { 
          setTimeout(function(){
            callback(hash, callback);
          },500);
        } else {
          vent.emit("payment", payment);
	  if (payment) {
	    gateway.config.set('LAST_PAYMENT_HASH', payment.hash);
            gateway.config.save(function(){
              callback(notification.next_notification_hash, callback);
            });
	  } else {
            callback(notification.next_notification_hash, callback);
          }
	 
        }
      });

    } else {
      setTimeout(function(){
        callback(hash, callback);
      },500);
    }
  });
}

function RippleAccountListener(options) {
  this.client = new Client({
    api: gateway.config.get('RIPPLE_REST_API'),
    account: options.account,
    secret: ''
  });
};

util.inherits(RippleAccountListener, EventEmitter);

RippleAccountListener.prototype.start = function(hash) {
  var self = this;
  vent.on('payment', function(payment) {
    if (payment.result === 'tesSUCCESS') {
      gateway.logger.info('Incoming payment with tesSUCCESS engine result', payment);
      self.onPayment(payment);
    } else {
      gateway.logger.info('Incoming payment with non-tesSUCCESS engine result', payment);
    }
  });
  self.pollForPayments(hash, self.pollForPayments);
};

module.exports = RippleAccountListener;

