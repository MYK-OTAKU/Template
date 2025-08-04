const { Sequelize } = require('sequelize');

// Test de connexion direct à Supabase
async function testSupabaseConnection() {
  console.log('🔍 Test des différentes configurations Supabase...\n');

  // Configuration 1: Pooler (recommandé)
  const config1 = {
    database: 'postgres',
    username: 'postgres',
    password: 'MyK91@33837',
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 6543,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  };

  // Configuration 2: URL directe
  const config2 = {
    database: 'postgres',
    username: 'postgres',
    password: 'MyK91@33837',
    host: 'db.oqqjtfuiwuelsqdyeaek.supabase.co',
    port: 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  };

  // Configuration 3: URL avec postgres.
  const config3 = {
    database: 'postgres',
    username: 'postgres',
    password: 'MyK91@33837',
    host: 'postgres.oqqjtfuiwuelsqdyeaek.supabase.co',
    port: 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  };

  const configs = [
    { name: 'Pooler Supabase', config: config1 },
    { name: 'URL directe db.', config: config2 },
    { name: 'URL postgres.', config: config3 }
  ];

  for (const { name, config } of configs) {
    console.log(`🔗 Test: ${name}`);
    console.log(`   Host: ${config.host}:${config.port}`);
    
    const sequelize = new Sequelize(config);
    
    try {
      await sequelize.authenticate();
      console.log(`✅ ${name} - Connexion réussie!\n`);
      
      // Tester une requête simple
      const [results] = await sequelize.query('SELECT version()');
      console.log(`📋 Version PostgreSQL: ${results[0].version}\n`);
      
      await sequelize.close();
      
      console.log(`🎉 Configuration recommandée trouvée: ${name}`);
      console.log(`📝 Utilisez ces paramètres dans votre .env:`);
      console.log(`DB_HOST=${config.host}`);
      console.log(`DB_PORT=${config.port}`);
      
      return config;
      
    } catch (error) {
      console.log(`❌ ${name} - Échec: ${error.message}\n`);
      await sequelize.close();
    }
  }
  
  console.log('❌ Aucune configuration de connexion n\'a fonctionné.');
  console.log('\n🔧 Suggestions :');
  console.log('1. Vérifiez que Supabase est accessible depuis votre réseau');
  console.log('2. Vérifiez le mot de passe dans l\'interface Supabase');
  console.log('3. Assurez-vous que les connexions externes sont autorisées');
}

testSupabaseConnection().catch(console.error);
