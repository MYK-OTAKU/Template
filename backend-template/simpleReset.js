require('dotenv').config();
const { sequelize } = require('./config/sequelize');

const resetDb = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected! Dropping and recreating tables...');
    
    await sequelize.sync({ force: true });
    console.log('Tables recreated successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetDb();
