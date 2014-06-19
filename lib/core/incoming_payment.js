var data = require(__dirname+'/../data/');
var config = require(__dirname+'/../../config/config.js');
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
    if (self.destination_tag === '') { return callback(false) };
    data.models.externalAccounts.find({ where: {
      id: self.destination_tag
    }}).complete(function(error, externalAccount) {
      if (error) {
        callback(false, error);
      } else if (externalAccount) {
        callback(true, externalAccount);
      } else {
        callback(false, 'no external account found');
      }
    });
  },
  
  recordInDatabase: function(state, callback) {
    var self = this;
    var destinationTag = self.destination_tag === '' ? null : self.destination_tag;
    var sourceTag = self.source_tag === '' ? null : self.source_tag;
    var to_address = {
      address: self.destination_account,
      tag: destinationTag
    };
    var from_address = {
      address: self.source_account,
      tag: sourceTag
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
        if (i==0) { self.toAddress = address; }
        if (i==1) { self.fromAddress = address; }
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
        from_issuer: self.source_amount.issuer,
        state: state
      }).complete(function(error, payment){
        self.record = payment;
        callback(error, payment);
      });
    });
  },
  
  bounce: function(callback) {
    var self = this;
    self.recordInDatabase('bounced', function(error, bouncedPayment) {
      data.models.rippleTransactions.create({
        to_address_id: self.fromAddress.id,
        from_address_id: self.toAddress.id,
        from_amount: self.destination_amount.value,
        from_currency: self.destination_amount.currency,
        from_issuer: self.destination_amount.issuer,
        to_amount: self.source_amount.value,
        to_currency: self.source_amount.currency,
        to_issuer: self.source_amount.issuer,
        state: 'outgoing',
        data: { bounced_payment_id: bouncedPayment.id }
      }).complete(function(error, outgoingPayment){
        outgoingPayment.fromAddress = self.toAddress;
        outgoingPayment.toAddress = self.fromAddress;
        callback(error, outgoingPayment);
      });
    });
  }

};

  module.exports = IncomingPayment;

