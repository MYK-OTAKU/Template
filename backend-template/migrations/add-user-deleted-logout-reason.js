'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter les nouvelles valeurs à l'ENUM logoutReason
    await queryInterface.sequelize.query(`
      ALTER TABLE user_sessions 
      MODIFY COLUMN logoutReason ENUM(
        'EXPLICIT',
        'TIMEOUT',
        'NEW_LOGIN',
        'NEW_LOGIN_2FA',
        'ADMIN_LOGOUT',
        'USER_DELETED',
        'ACCOUNT_DISABLED',
        'SECURITY_BREACH',
        'MAINTENANCE',
        'TWO_FACTOR_DISABLED'
      )
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revenir à l'ancien ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE user_sessions 
      MODIFY COLUMN logoutReason ENUM(
        'EXPLICIT',
        'TIMEOUT',
        'NEW_LOGIN',
        'NEW_LOGIN_2FA',
        'ADMIN_LOGOUT'
      )
    `);
  }
};