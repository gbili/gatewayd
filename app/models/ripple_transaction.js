var Sequelize = require('sequelize');
var db = require('../../config/initializers/sequelize');

module.exports = sequelize.define('ripple_transaction', {
  id:             { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  to_currency:     { type: Sequelize.STRING, notNull: true },
  to_address:      { type: Sequelize.STRING, notNull: true },
  to_currency:     { type: Sequelize.STRING, notNull: true },
  to_amount:       { type: Sequelize.DECIMAL, notNull: true },
  from_currency:   { type: Sequelize.STRING, notNull: true },
  from_amount:     { type: Sequelize.DECIMAL, notNull: true },
  from_address:    { type: Sequelize.STRING, notNull: true },
  issuance:       { type: Sequelize.BOOLEAN, notNull: true },
  destination_tag: { type: Sequelize.STRING },
  source_tag:      { type: Sequelize.INTEGER },
  transaction_hash:         { type: Sequelize.STRING },
  transaction_state:        { type: Sequelize.STRING }
})

