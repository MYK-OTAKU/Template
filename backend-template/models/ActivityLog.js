const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resourceType: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  resourceId: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(['SUCCESS', 'FAILURE', 'WARNING', 'INFO']),
    allowNull: false,
    defaultValue: 'SUCCESS'
  },
  oldValues: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  newValues: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'activity_logs',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['action']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['resourceType', 'resourceId']
    }
  ]
});

// ✅ IMPORTANT: Exporter directement le modèle
module.exports = ActivityLog;