var data = require(__dirname+'/../../data/');
var config = require(__dirname+'/../../../config/config.js');
var async = require('async');

function IncomingPayment(restPayment) {
  for (key in restPayment) {
    this[key] = restPayment[key];
  }

  this.isValidDestinationTag = false;
}

IncomingPayment.prototype = {

  checkDestinationTagValidity: function(callback) {
    var self = this;
    data.models.externalAccounts.find({ where: {
      id: self.destination_tag
    }}).complete(function(error, externalAccount) {
      if (error) {
        callback(error, null);
      } else if (externalAccount) {
        callback(null, externalAccount); 
      } else {
        callback('no external account found', null);
      }
    });
  },
  
  recordInDatabase: function(callback) {
    var self = this;
    var to_address = {
      address: self.destination_account,
      tag: self.destination_tag
    };
    var from_address = {
      address: self.source_account,
      tag: self.source_tag
    };
    var hotWalletAddress = config.get('HOT_WALLET').address;
    var coldWalletAddress = config.get('COLD_WALLET');
    var i = 0;
    async.map([to_address, from_address], function(address, next) {
      var managed;
      var type;
      if (address.address == hotWalletAddress || address.address == coldWalletAddress) {
        managed = true; 
      } else {
        managed = false;
      }
      if (address.tag && address.tag != "") {
        type = 'hosted'; 
      } else {
        type = 'independent';
      }
      data.models.rippleAddresses.findOrCreate(address, {
        managed: managed,
        type: type
      }).complete(function(error, address){
        if (i==0) { self.toAddress = address }
        if (i==1) { self.fromAddress = address }
        i += 1;
        next(error, address);
      });
    }, function(error, addresses){
      if (error) { return callback(error, null) } 
      data.models.rippleTransactions.findOrCreate({
        transaction_hash: self.hash 
      }, {
        to_address_id: addresses[0].id,
        from_address_id: addresses[1].id,
        to_amount: self.destination_amount.value,
        to_currency: self.destination_amount.currency,
        to_issuer: self.destination_amount.issuer, 
        from_amount: self.source_amount.value,
        from_currency: self.source_amount.currency,
        from_issuer: self.source_amount.issuer
      }).complete(function(error, payment){
        self.record = payment;
        callback(error, payment);
      });
    });
  },
  
  bounce: function(callback) {
    var self = this;
    var toAddress = self.fromAddress;
    var fromAddress = self.toAddress;
    data.models.rippleTransactions.create({
      to_address_id: toAddress.id,
      from_address_id: fromAddress.id,
      from_amount: self.destination_amount.value,
      from_currency: self.destination_amount.currency,
      from_issuer: self.destination_amount.issuer, 
      to_amount: self.source_amount.value,
      to_currency: self.source_amount.currency,
      to_issuer: self.source_amount.issuer,
      state: 'outgoing'
    }).complete(function(error, outgoingPayment){
      outgoingPayment.toAddress = toAddress;
      outgoingPayment.fromAddress = fromAddress;
      self.record.updateAttributes({
        state: 'bounced'
      }).complete(function(error, originalTransaction) {
        self.record = originalTransaction;
        callback(error, outgoingPayment);
      });
    });
  }

};

  module.exports = IncomingPayment;

