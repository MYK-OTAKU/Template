const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const UserSession = sequelize.define('userSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  ipAddress: {
    type: DataTypes.STRING(145), // Pour supporter IPv6
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  loginDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  logoutDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  logoutReason: {
    type: DataTypes.STRING(150), // Augmenter la taille à 50 caractères
    allowNull: true,
    validate: {
      isIn: [['EXPLICIT', 'TIMEOUT', 'ADMIN_TERMINATED', 'NEW_LOGIN', 'NEW_LOGIN_2FA', 'TOKEN_EXPIRED', 'FORCED']]
    }
  },
  previousIp: {
    type: DataTypes.STRING(145),
    allowNull: true
  },
  ipChanged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ipChangeDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
  
}, {
  tableName: 'userSessions',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['lastActivity']
    }
  ]
});

module.exports = UserSession;