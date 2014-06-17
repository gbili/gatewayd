var gateway = require(__dirname+'/../../');
var assert = require('assert');
var IncomingPayment = require(__dirname+'/../../lib/core/payments/incoming.js')
var incomingPayment;
var outgoingPayment;
var recordedPayment;

describe('Incoming Payments', function() {

  describe('Validating destination tag', function() {

    it('should have a destination tag', function() {
      assert.strictEqual(incomingPayment.destination_tag, '103');
    });

    it('should verify whether a destination tag is valid', function(done) {
      incomingPayment.checkDestinationTagValidity(function(isValidDestinationTag){
        assert(!isValidDestinationTag);
        done();
      });  
    });

    it('should reject an empty destination tag', function(done) {
      incomingPayment.destinationTag = '';
      incomingPayment.checkDestinationTagValidity(function(isValidDestinationTag){
        assert(!isValidDestinationTag);
        done();
      });  
    });

    it('should reject a destination tag with no external account id', function(done) {
      incomingPayment.destinationTag = '440008933838';
      incomingPayment.checkDestinationTagValidity(function(isValidDestinationTag){
        assert(!isValidDestinationTag);
        done();
      });  
    });
  });

  describe('Saving the incoming payment', function() {

    it('should create a database record for the payment', function(done) {

      incomingPayment.recordInDatabase(function(error, paymentRecord) {
        recordedPayment = paymentRecord; 
        assert(!error);
        assert(paymentRecord);
        assert.strictEqual(paymentRecord.to_amount, '50');
        assert.strictEqual(paymentRecord.to_currency, 'XRP');
        assert(incomingPayment.record === paymentRecord);
        assert.strictEqual(incomingPayment.record.to_amount, '50');
        assert.strictEqual(incomingPayment.record.to_currency, 'XRP');
        done();
      });

    });

    it('should create a ripple address record for the recipient', function(done) {

      gateway.data.models.rippleAddresses.find({ where: {
        id: recordedPayment.to_address_id
      }}).complete(function(error, rippleAddress) {
        if (error) {
          throw new Error(error);
        } else if (rippleAddress) {
          assert(rippleAddress.id > 0);
          assert.strictEqual(rippleAddress.address, 'r34hCTPrhtKntvxGChTRhLGu7zenBd627J');
          assert.strictEqual(rippleAddress.tag, 103);
          done();
        } else {
          throw new Error('ripple address not found', recordedPayment.to_address_id);
        }
      });

    });

    it('should create a ripple address record for the sender', function(done) {

      gateway.data.models.rippleAddresses.find({ where: {
        id: recordedPayment.from_address_id
      }}).complete(function(error, rippleAddress) {
        if (error) {
          throw new Error(error);
        } else if (rippleAddress) {
          assert(rippleAddress.id > 0);
          assert.strictEqual(rippleAddress.address, 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk');
          assert.strictEqual(rippleAddress.tag, 22556);
          done();
        } else {
          throw new Error('ripple address not found', recordedPayment.to_address_id);
        }
      });

    });
 
  });

  describe('Bouncing invalid payments', function() {

    before(function(done) {
      incomingPayment.bounce(function(error, queuedOutoingPayment) {
        outgoingPayment = queuedOutoingPayment;
        done();
      });
    });
  
    it('should enqueue an outgoing payment record with inverted source/destination', function(done) {
      assert.strictEqual(outgoingPayment.toAddress.tag, 22556);
      assert.strictEqual(outgoingPayment.fromAddress.tag, 103);
      assert.strictEqual(outgoingPayment.to_amount, '20');
      assert.strictEqual(outgoingPayment.to_currency, 'USD');
      assert.strictEqual(outgoingPayment.from_amount, '1');
      assert.strictEqual(outgoingPayment.from_currency, 'XAU');
      assert(!outgoingPayment.transaction_hash);
      assert(!outgoingPayment.transaction_state);
      assert(outgoingPayment.id);
      done();
    });

    it('should update the state to "bounced"', function(done) {
      gateway.data.models.rippleTransactions.find({ where: {
        id: recordedPayment.id
      }}).complete(function(error, recordedPayment) {
        assert.strictEqual(recordedPayment.state, 'bounced');
        done();
      });
    });

  });
    
  before(function() {
    incomingPayment = new IncomingPayment({
      "source_account": "r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk",
      "source_tag": "22556",
      "source_amount": {
        "value": "20",
        "currency": "USD",
        "issuer": ""
      },
      "source_slippage": "0",
      "destination_account": "r34hCTPrhtKntvxGChTRhLGu7zenBd627J",
      "destination_tag": "103",
      "destination_amount": {
        "value": "1",
        "currency": "XAU",
        "issuer": ""
      },
      "invoice_id": "",
      "paths": "[]",
      "no_direct_ripple": false,
      "partial_payment": false,
      "direction": "incoming",
      "state": "validated",
      "result": "tesSUCCESS",
      "ledger": "7231683",
      "hash": "605A22E57C5ACA2D8F7C54930F5F93085D25AFB7BBB2967EE041FA4BA58A0C0E",
      "timestamp": "+046457-07-13T21:40:00.000Z",
      "fee": "0.000012",
      "source_balance_changes": [
        {
          "value": "-50.000012",
          "currency": "XRP",
          "issuer": ""
        }
      ],
      "destination_balance_changes": [
        {
          "value": "50",
          "currency": "XRP",
          "issuer": ""
        }
      ]
    });
  });
});

