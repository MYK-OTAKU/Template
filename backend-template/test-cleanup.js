const AuditService = require('./services/AuditService');

async function testCleanup() {
  try {
    console.log('🧪 Test du nettoyage des sessions...');
    const result = await AuditService.cleanupInactiveSessions(240);
    console.log('✅ Test réussi, sessions nettoyées:', result);
  } catch (error) {
    console.error('❌ Test échoué:', error);
  }
  process.exit(0);
}

testCleanup();