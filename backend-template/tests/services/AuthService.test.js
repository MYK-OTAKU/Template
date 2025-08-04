const AuthService = require('../../services/AuthService');
const { TestFactory } = require('../helpers/testHelpers');
const { User } = require('../../models');
const speakeasy = require('speakeasy');

describe('🔧 AuthService - Tests des Services d\'Authentification', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await TestFactory.createAdminUser();
  });

  describe('🔐 enableTwoFactor - Tests d\'Activation 2FA', () => {
    it('✅ Doit activer 2FA pour la première fois', async () => {
      const result = await AuthService.enableTwoFactor(testUser.id, false);

      expect(result.success).toBe(true);
      expect(result.qrCode).toBeDefined();
      expect(result.manualEntryKey).toBeDefined();
      expect(result.isNewSetup).toBe(true);
      expect(result.isReactivation).toBe(false);

      // Vérifier en base
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.twoFactorEnabled).toBe(true);
      expect(updatedUser.twoFactorSecret).toBeTruthy();
    });

    it('✅ Doit détecter une réactivation après désactivation', async () => {
      // 1. Activer 2FA
      await AuthService.enableTwoFactor(testUser.id, false);
      
      // 2. Désactiver 2FA en gardant le secret
      await AuthService.disableTwoFactor(testUser.id, true);
      
      // 3. Réactiver 2FA
      const result = await AuthService.enableTwoFactor(testUser.id, false);

      expect(result.success).toBe(true);
      expect(result.isReactivation).toBe(true);
      expect(result.isNewSetup).toBe(true);
      expect(result.qrCode).toBeDefined();
    });
  });

  describe('🔓 disableTwoFactor - Tests de Désactivation 2FA', () => {
    beforeEach(async () => {
      // Activer 2FA d'abord
      await AuthService.enableTwoFactor(testUser.id, false);
    });

    it('✅ Doit désactiver 2FA et supprimer le secret', async () => {
      const result = await AuthService.disableTwoFactor(testUser.id, false);

      expect(result.success).toBe(true);
      expect(result.secretRemoved).toBe(true);

      // Vérifier en base
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.twoFactorEnabled).toBe(false);
      expect(updatedUser.twoFactorSecret).toBeNull();
    });

    it('✅ Doit désactiver 2FA en conservant le secret', async () => {
      const result = await AuthService.disableTwoFactor(testUser.id, true);

      expect(result.success).toBe(true);
      expect(result.secretRemoved).toBe(false);

      // Vérifier en base
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.twoFactorEnabled).toBe(false);
      expect(updatedUser.twoFactorSecret).toBeTruthy();
    });
  });

  describe('🔄 regenerateTwoFactorSecret - Tests de Régénération', () => {
    beforeEach(async () => {
      // Activer 2FA d'abord
      await AuthService.enableTwoFactor(testUser.id, false);
    });

    it('✅ Doit régénérer le secret 2FA', async () => {
      const oldUser = await User.findByPk(testUser.id);
      const oldSecret = oldUser.twoFactorSecret;

      const result = await AuthService.regenerateTwoFactorSecret(testUser.id);

      expect(result.success).toBe(true);
      expect(result.isRegeneration).toBe(true);
      expect(result.qrCode).toBeDefined();

      // Vérifier que le secret a changé
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.twoFactorSecret).not.toBe(oldSecret);
      expect(updatedUser.twoFactorEnabled).toBe(true);
    });
  });
});