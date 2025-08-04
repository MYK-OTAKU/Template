const { Settings } = require('../models');
const { Op } = require('sequelize');

class SettingsController {
  // Récupérer les paramètres publics (sans authentification)
  static async getPublicSettings(req, res) {
    try {
      const { category } = req.query;
      
      const whereClause = { isPublic: true };
      if (category) {
        whereClause.category = category;
      }

      const settings = await Settings.findAll({
        where: whereClause,
        attributes: ['key', 'value', 'type']
      });

      // Convertir en objet avec conversion de type
      const settingsObject = {};
      settings.forEach(setting => {
        settingsObject[setting.key] = SettingsController.convertValue(setting.value, setting.type);
      });

      res.json({
        success: true,
        data: { settings: settingsObject }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres publics:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paramètres'
      });
    }
  }

  // Récupérer tous les paramètres (admin uniquement)
  static async getAllSettings(req, res) {
    try {
      const { category } = req.query;
      
      const whereClause = {};
      if (category) {
        whereClause.category = category;
      }

      const settings = await Settings.findAll({
        where: whereClause,
        order: [['category', 'ASC'], ['key', 'ASC']]
      });

      // Convertir en objet avec conversion de type
      const settingsObject = {};
      settings.forEach(setting => {
        settingsObject[setting.key] = SettingsController.convertValue(setting.value, setting.type);
      });

      res.json({
        success: true,
        data: { settings: settingsObject }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les paramètres:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paramètres'
      });
    }
  }

  // Créer un nouveau paramètre (admin uniquement)
  static async createSetting(req, res) {
    try {
      const { key, value, type, category, isPublic } = req.body;

      // Validation du format de la clé
      if (!SettingsController.validateKey(key)) {
        return res.status(400).json({
          success: false,
          message: 'Format de clé invalide. Utilisez le format: category.setting_name'
        });
      }

      // Validation de la valeur selon le type
      if (!SettingsController.validateValue(value, type)) {
        return res.status(400).json({
          success: false,
          message: `Valeur invalide pour le type ${type}`
        });
      }

      // Validation de la catégorie
      if (!SettingsController.validateCategory(category)) {
        return res.status(400).json({
          success: false,
          message: 'Nom de catégorie invalide'
        });
      }

      // Nettoyer la valeur si nécessaire
      const sanitizedValue = SettingsController.sanitizeValue(value, type);

      const setting = await Settings.create({
        key,
        value: sanitizedValue,
        type,
        category,
        isPublic: isPublic || false
      });

      res.status(201).json({
        success: true,
        data: { setting }
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: 'Un paramètre avec cette clé existe déjà'
        });
      }

      console.error('Erreur lors de la création du paramètre:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du paramètre'
      });
    }
  }

  // Mettre à jour un paramètre (admin uniquement)
  static async updateSetting(req, res) {
    try {
      const { key } = req.params;
      const { value, type, category, isPublic } = req.body;

      // Validation de la valeur selon le type
      if (!SettingsController.validateValue(value, type)) {
        return res.status(400).json({
          success: false,
          message: `Valeur invalide pour le type ${type}`
        });
      }

      // Validation de la catégorie
      if (category && !SettingsController.validateCategory(category)) {
        return res.status(400).json({
          success: false,
          message: 'Nom de catégorie invalide'
        });
      }

      // Nettoyer la valeur si nécessaire
      const sanitizedValue = SettingsController.sanitizeValue(value, type);

      const [updatedRows] = await Settings.update({
        value: sanitizedValue,
        type,
        category,
        isPublic
      }, {
        where: { key }
      });

      if (updatedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Paramètre non trouvé'
        });
      }

      const updatedSetting = await Settings.findOne({ where: { key } });

      res.json({
        success: true,
        data: { setting: updatedSetting }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paramètre:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du paramètre'
      });
    }
  }

  // Supprimer un paramètre (admin uniquement)
  static async deleteSetting(req, res) {
    try {
      const { key } = req.params;

      const deletedRows = await Settings.destroy({
        where: { key }
      });

      if (deletedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Paramètre non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Paramètre supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du paramètre:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du paramètre'
      });
    }
  }

  // Création en masse de paramètres (admin uniquement)
  static async bulkCreateSettings(req, res) {
    try {
      const { settings } = req.body;

      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Format de données invalide'
        });
      }

      const settingsArray = [];
      for (const [key, settingData] of Object.entries(settings)) {
        // Validation pour chaque paramètre
        if (!SettingsController.validateKey(key)) {
          return res.status(400).json({
            success: false,
            message: `Format de clé invalide: ${key}`
          });
        }

        if (!SettingsController.validateValue(settingData.value, settingData.type)) {
          return res.status(400).json({
            success: false,
            message: `Valeur invalide pour ${key}`
          });
        }

        settingsArray.push({
          key,
          value: SettingsController.sanitizeValue(settingData.value, settingData.type),
          type: settingData.type,
          category: settingData.category,
          isPublic: settingData.isPublic || false
        });
      }

      const createdSettings = await Settings.bulkCreate(settingsArray, {
        ignoreDuplicates: true
      });

      res.status(201).json({
        success: true,
        data: { 
          created: createdSettings.length,
          settings: createdSettings
        }
      });
    } catch (error) {
      console.error('Erreur lors de la création en masse:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création en masse des paramètres'
      });
    }
  }

  // Récupérer les préférences utilisateur
  static async getUserPreferences(req, res) {
    try {
      const userId = req.user.id;
      
      const userSettings = await Settings.findAll({
        where: {
          key: {
            [Op.like]: `user.${userId}.%`
          }
        }
      });

      // Convertir en objet de préférences
      const preferences = {};
      userSettings.forEach(setting => {
        const prefKey = setting.key.replace(`user.${userId}.`, '');
        preferences[prefKey] = SettingsController.convertValue(setting.value, setting.type);
      });

      // Ajouter les valeurs par défaut si elles n'existent pas
      const defaultPreferences = {
        theme: 'auto',
        language: 'fr',
        notifications_email: true,
        notifications_push: true,
        font_size: 'medium',
        sidebar_collapsed: false,
        dashboard_layout: 'default'
      };

      const finalPreferences = { ...defaultPreferences, ...preferences };

      res.json({
        success: true,
        data: { preferences: finalPreferences }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des préférences:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des préférences'
      });
    }
  }

  // Mettre à jour les préférences utilisateur
  static async updateUserPreferences(req, res) {
    try {
      const userId = req.user.id;
      const preferences = req.body;

      const allowedPreferences = [
        'theme', 'language', 'notifications_email', 'notifications_push',
        'font_size', 'sidebar_collapsed', 'dashboard_layout', 'timezone',
        'date_format', 'time_format', 'items_per_page'
      ];

      const updates = [];
      for (const [key, value] of Object.entries(preferences)) {
        if (!allowedPreferences.includes(key)) {
          continue; // Ignorer les préférences non autorisées
        }

        const settingKey = `user.${userId}.${key}`;
        const type = SettingsController.inferType(value);
        
        updates.push({
          key: settingKey,
          value: String(value),
          type,
          category: 'user_preferences',
          isPublic: false
        });
      }

      // Utiliser upsert pour créer ou mettre à jour
      for (const update of updates) {
        await Settings.upsert(update);
      }

      res.json({
        success: true,
        message: 'Préférences mises à jour avec succès',
        data: { updated: updates.length }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour des préférences'
      });
    }
  }

  // Méthodes utilitaires
  static validateKey(key) {
    // Format: category.setting_name ou user.id.preference_name
    const keyRegex = /^[a-z][a-z0-9_]*\.[a-z0-9_]+(\.[a-z0-9_]+)*$/;
    return keyRegex.test(key);
  }

  static validateCategory(category) {
    const categoryRegex = /^[a-z][a-z0-9_]*$/;
    return categoryRegex.test(category);
  }

  static validateValue(value, type) {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return !isNaN(Number(value));
      case 'boolean':
        return value === 'true' || value === 'false' || typeof value === 'boolean';
      case 'json':
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  static sanitizeValue(value, type) {
    if (type === 'string') {
      // Nettoyer les balises HTML potentiellement dangereuses
      return String(value)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '');
    }
    return value;
  }

  static convertValue(value, type) {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === true;
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  static inferType(value) {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'object') return 'json';
    return 'string';
  }
}

module.exports = SettingsController;

