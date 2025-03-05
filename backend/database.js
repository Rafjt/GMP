require('dotenv').config();

console.log('Database:', process.env.RRPM_DB_NAME);
console.log('User:', process.env.RRPM_DB_USER);
console.log('Host:', process.env.RRPM_URL);

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.RRPM_DB_NAME, 
  process.env.RRPM_DB_USER, 
  process.env.RRPM_DB_PASSWORD, 
  {
    host: process.env.RRPM_URL,
    dialect: 'postgres'
  }
);

sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize;