require('dotenv').config();
const { sequelize } = require('../models');

const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database schema...');
    await sequelize.sync({ force: true });
    console.log('✅ Database schema initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
};

initializeDatabase();
