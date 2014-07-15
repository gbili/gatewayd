var nconf = require( __dirname + '/config/config.js' );

module.exports = function (grunt) {

  grunt.initConfig({

    migrate: {
      options: {
        config: './lib/data/database.json',
        'migrations-dir': './lib/data/migrations',
        verbose: true,
        env: {
          DATABASE_URL: nconf.get('DATABASE_URL')
        }
      }
    },

    jsdoc : {
      dist : {
        src: ['./index.js', './lib/api/*.js'],
        options: {
            destination: './doc/jsdoc'
        }
      }
    }

  });
  
  grunt.loadNpmTasks('grunt-db-migrate');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.registerTask('default', ['migrate']);
};
