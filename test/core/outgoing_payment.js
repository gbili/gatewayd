var OutgoingPayment = require(__dirname+'/../../lib/core/outgoing_payment.js');

describe('Outgoing Payment', function(){
  before(function() {
    // construct an outgoing payment record in the database
    gateway.data.rippleTransactions.create({
      to_address_id: 2,
      from_address_id: 1,
      to_amount: 150,
      to_currency: 'XAG',
      from_amount: 150,
      from_currency: 'XAG'
    })
    .complete(function(error, rippleTransactionRecord) {
      outgoingPayment = new OutgoingPayment(rippleTransactionRecord);
    });

  });

  it('should send an outgoing payment to Ripple REST', function(done) {

  });

  it('should confirm the status of a sent payment', function(done) {

  });

  it('should re-enqueue a payment if it fails due to network connectivity', function(done) {

  });

  it('should mark payment as failed if rippled reports it as invalid', function(done) {

  });

  describe('Enqueuing an Outgoing Payment', function(done) {

    it('should require a to_amount', function() {

      gateway.api.enqueueOutgoingPayment({ 
        to_address: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk',
        to_amount: 10,
        to_currency: 'XAG'    
      }, function(error, outgoingPayment) {
        assert.strictEqual(outgoingPayment.status, 'outgoing');
        assert(!outgoingPayment.to_address);
        assert.strictEqual(outgoingPayment.to_address_id);
        assert.strictEqual(outgoingPayment.from_address_id, gateway.config.get('HOT_WALLET').id);
        assert.strictEqual(outgoingPayment.to_amount, 10);
        assert.strictEqual(outgoingPayment.from_amount, 10);
        assert.strictEqual(outgoingPayment.to_currency, 'XAG');
        assert.strictEqual(outgoingPayment.from_currency, 'XAG');
      });

    });

    it('should require a to_currency', function() {
      gateway.api.enqueueOutgoingPayment({ 
        to_address: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk',
        to_amount: 10
      }, function(error, outgoingPayment) {
        assert.strictEqual(error.fields.to_currency, 'to_currency is required');
        assert(!outgoingPayment);
      });
    });
  
    it('to_currency must be a valid ripple currency string', function() {
      gateway.api.enqueueOutgoingPayment({ 
        to_address: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk',
        to_amount: 10,
        to_currency: '1111'
      }, function(error, outgoingPayment) {
        assert.strictEqual(error.fields.to_currency, 'to_currency must be a valid ripple currency string');
        assert(!outgoingPayment);
      });
    });

    it('should require a to_address', function() { 
      gateway.api.enqueueOutgoingPayment({ 
        to_amount: 10,
        to_currency: 'XAG'
      }, function(error, outgoingPayment) {
        assert.strictEqual(error.fields.to_address, 'to_address is required');
        assert(!outgoingPayment);
      });
    });

    it('to_address must be a valid ripple address', function() {
      gateway.api.enqueueOutgoingPayment({ 
        to_address: 'x5HxYRyisfGzMto3AT8FZiYdWk',
        to_amount: 10,
        to_currency: 'XAG'
      }, function(error, outgoingPayment) {
        assert.strictEqual(error.fields.to_address, 'to_address must be a valid ripple address');
        assert(!outgoingPayment);
      });
    });

    it('should require a to_amount', function() {
      gateway.api.enqueueOutgoingPayment({ 
        to_address: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk',
        to_currency: 'XAG'
      }, function(error, outgoingPayment) {
        assert.strictEqual(error.fields.to_amount, 'to_amount is required');
        assert(!outgoingPayment);
      });
    });

    it('to_amount should be in numeric format', function() {
      gateway.api.enqueueOutgoingPayment({ 
        to_address: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk',
        to_currency: 'XAG',
        to_amount: 'X1AG'
      }, function(error, outgoingPayment) {
        assert.strictEqual(error.fields.to_amount, 'to_amount must be numeric');
        assert(!outgoingPayment);
      });
    });

    it('to_amount should be greater than zero', function() {
      gateway.api.enqueueOutgoingPayment({ 
        to_address: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk',
        to_currency: 'XAG',
        to_amount: '-1.2'
      }, function(error, outgoingPayment) {
        assert.strictEqual(error.fields.to_amount, 'to_amount must be greater than zero');
        assert(!outgoingPayment);
      });
    });

    it('should allow a destination_tag to be specified', function() {
      gateway.api.enqueueOutgoingPayment({ 
        to_address: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk',
        to_currency: 'XAG',
        to_amount: 10.22,
        destination_tag: 101
      }, function(error, outgoingPayment) {
        // look up ripple address record using to_address_id
        // assert that ripple address record has correct tag
      });

    });

    it('should allow a send_tag to be specified', function() {
      gateway.api.enqueueOutgoingPayment({ 
        to_address: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk',
        to_currency: 'XAG',
        to_amount: 11.88,
        send_tag: 202
      }, function(error, outgoingPayment) {
        // look up ripple address record using from_address_id
        // assert that ripple address record has correct tag
      });
    });

    it('should allow a from_currency to be specified', function() {
      gateway.api.enqueueOutgoingPayment({ 
        to_address: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk',
        to_currency: 'BTC',
        to_amount: 11.88,
        from_currency: 'XAU'
      }, function(error, outgoingPayment) {
        assert.strictEqual(outgoingPayment.from_currency, 'XAU');
        assert.strictEqual(outgoingPayment.to_currency, 'BTC');
        assert(!outgoingPayment);
      });
    });

    it('should allow a from_amount to be specified', function() {
      gateway.api.enqueueOutgoingPayment({ 
        to_address: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk',
        to_currency: 'XAG',
        to_amount: 30,
        from_amount: 1,
        from_currency: 'XAU'
      }, function(error, outgoingPayment) {
        assert.strictEqual(outgoingPayment.from_amount, 1);
        assert.strictEqual(outgoingPayment.to_amount, 30);
        assert(!outgoingPayment);
      });
    });

    it('should accept to_address_id instead of to_address', function() {
      gateway.api.enqueueOutgoingPayment({ 
        to_address_id: 220
        to_currency: 'XAG',
        to_amount: 30,
      }, function(error, outgoingPayment) {
        assert.strictEqual(outgoingPayment.to_address_id, 220);
        assert(!outgoingPayment);
      });
    });

    it('should reject to_address_id it the address record does not exist', function() {
      gateway.api.enqueueOutgoingPayment({
        
      });
    });

    it('should create a ripple address record given a ripple address', function() {

    }); 

    it('should use a ripple address record if already recorded, given a ripple address', function() {

    });

  });

});

