var gateway = require(__dirname+'/../../');
var assert = require('assert');
var async = require('async');

describe('Retrying a Failed Payment', function() {

  it('should move a failed payment back into the outgoing payment queue', function(done) {
    gateway.api.retryFailedPayment(failedPayment.id, function(error, payment) {
      assert(!error);
      assert.strictEqual(payment.state, 'outgoing'); 
      done();
    });
  });

  it('should not modify a payment not marked as failed', function(done) {
    gateway.api.retryFailedPayment(successfulPayment.id, function(error, payment) {
      assert.strictEqual(error.state, 'must be "failed"');
      gateway.data.models.rippleTransactions.find({ where: { id: successfulPayment.id }})
      .complete(function(error, transaction) {
        assert.strictEqual(transaction.state, 'succeeded');
        done();
      });
    });
  });
 
  before(function(done) {
    async.parallel([
      function(next) {
        gateway.data.models.rippleTransactions.create({
          state: 'failed',
          to_currency: 'XAG',
          to_amount: 10000,
          to_address_id: 999,
          from_address_id: 1,
          from_currency: 'XAG',
          from_amount: 10000,
          to_issuer: 'rp4u5gEskM8DtBZvonZwbu6dspgVdeAGM6',
          from_issuer: 'rp4u5gEskM8DtBZvonZwbu6dspgVdeAGM6'
        }).complete(function(error, rippleTransaction){
          failedPayment = rippleTransaction;
          next();
        });
      },
      function(next){
        gateway.data.models.rippleTransactions.create({
          state: 'succeeded',
          to_currency: 'XAG',
          to_amount: 10000,
          to_address_id: 999,
          from_address_id: 1,
          from_currency: 'XAG',
          from_amount: 10000,
          to_issuer: 'rp4u5gEskM8DtBZvonZwbu6dspgVdeAGM6',
          from_issuer: 'rp4u5gEskM8DtBZvonZwbu6dspgVdeAGM6'
        }).complete(function(error, rippleTransaction){
          successfulPayment = rippleTransaction;
          next();
        });
      }
    ], done);
  });
});

