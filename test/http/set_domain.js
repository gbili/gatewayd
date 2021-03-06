var request = require('supertest');
var app = require(__dirname+'/../../lib/app.js');
var gateway = require(__dirname+'/../../');

describe('set domain', function(){

  it('should return unauthorized without credentials', function(done){
    request(app)
      .post('/v1/config/domain')
      .expect(401)
      .end(function(err, res){
        if (err) throw err;
        done();
      });
  });

  it('should return successfully with credentials', function(done){
    request(app)
      .post('/v1/config/domain')
      .auth('admin@'+gateway.config.get('DOMAIN'), gateway.config.get('KEY'))
      .expect(200)
      .end(function(err, res){
        if (err) throw err;
        done();
      });
  });

});

