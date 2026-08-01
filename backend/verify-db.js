require('dotenv').config({ path: 'C:\\Users\\gayat\\Desktop\\queue-free-checkout-fresh\\backend\\.env' });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database connection...');
    console.log(`📍 Host: ${process.env.DB_HOST}`);
    console.log(`📍 Port: ${process.env.DB_PORT}`);
    console.log(`📍 Database: ${process.env.DB_NAME}`);
    console.log(`📍 User: ${process.env.DB_USER}`);

    await sequelize.authenticate();
    console.log('\n✅ Database connection successful!');

    // Query tables
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    console.log(`\n📊 Tables found: ${tables.length}`);
    tables.forEach(table => console.log(`  - ${table}`));

    // Query products
    const productCount = await sequelize.query('SELECT COUNT(*) as count FROM "Products"');
    console.log(`\n📦 Products in database: ${productCount[0][0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyDatabase();
