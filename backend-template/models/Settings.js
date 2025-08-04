const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Settings = sequelize.define('Settings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    allowNull: false,
    defaultValue: 'string'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'general',
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Si true, ce paramètre peut être lu par les utilisateurs non-admin'
  },
  isEditable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Si false, ce paramètre ne peut pas être modifié via l\'API'
  }
}, {
  tableName: 'settings',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['key']
    },
    {
      fields: ['category']
    },
    {
      fields: ['isPublic']
    }
  ]
});

// Méthodes statiques pour faciliter l'utilisation
Settings.getValue = async function(key, defaultValue = null) {
  try {
    const setting = await this.findOne({ where: { key } });
    if (!setting) return defaultValue;
    
    // Convertir la valeur selon le type
    switch (setting.type) {
      case 'number':
        return parseFloat(setting.value);
      case 'boolean':
        return setting.value === 'true';
      case 'json':
        return JSON.parse(setting.value);
      default:
        return setting.value;
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération du paramètre ${key}:`, error);
    return defaultValue;
  }
};

Settings.setValue = async function(key, value, type = 'string', description = null, category = 'general') {
  try {
    // Convertir la valeur en string pour le stockage
    let stringValue;
    switch (type) {
      case 'json':
        stringValue = JSON.stringify(value);
        break;
      case 'boolean':
        stringValue = value ? 'true' : 'false';
        break;
      default:
        stringValue = String(value);
    }

    const [setting, created] = await this.findOrCreate({
      where: { key },
      defaults: {
        key,
        value: stringValue,
        type,
        description,
        category
      }
    });

    if (!created) {
      setting.value = stringValue;
      setting.type = type;
      if (description !== null) setting.description = description;
      setting.category = category;
      await setting.save();
    }

    return setting;
  } catch (error) {
    console.error(`Erreur lors de la définition du paramètre ${key}:`, error);
    throw error;
  }
};

Settings.getByCategory = async function(category, publicOnly = false) {
  try {
    const where = { category };
    if (publicOnly) {
      where.isPublic = true;
    }

    const settings = await this.findAll({ where });
    
    // Convertir en objet clé-valeur
    const result = {};
    for (const setting of settings) {
      result[setting.key] = await this.getValue(setting.key);
    }
    
    return result;
  } catch (error) {
    console.error(`Erreur lors de la récupération des paramètres de la catégorie ${category}:`, error);
    throw error;
  }
};

module.exports = Settings;

