const bcrypt = require('bcrypt');
const { User, Role, Permission } = require('../../models');
const { generateToken } = require('../../config/jwt');

/**
 * Factory pour créer des rôles selon le cahier des charges Dashboard Template
 */
class TestFactory {
  static async createRole(name, permissions = []) {
    const role = await Role.create({
      name,
      description: `${name} - Test Role`
    });

    // Ajouter des permissions si spécifiées
    if (permissions.length > 0) {
      const permissionObjects = await Promise.all(
        permissions.map(permName => 
          Permission.findOrCreate({
            where: { name: permName },
            defaults: { description: `${permName} permission` }
          }).then(([perm]) => perm)
        )
      );
      await role.setPermissions(permissionObjects);
    }

    return role;
  }

  static async createUser(userData = {}) {
    const defaults = {
      username: 'testuser',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@template.com',
      isActive: true,
      twoFactorEnabled: false
    };

    const hashedPassword = await bcrypt.hash(userData.password || defaults.password, 10);
    
    return await User.create({
      ...defaults,
      ...userData,
      password: hashedPassword
    });
  }

  static async createAdminUser() {
    const adminRole = await this.createRole('Administrateur', [
      'ADMIN', 'USERS_ADMIN', 'VIEW_STATS_FINANCIAL'
    ]);

    return await this.createUser({
      username: 'admin',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'Template',
      roleId: adminRole.id
    });
  }

  static async createEmployeeUser() {
    const employeeRole = await this.createRole('Employé', ['SESSIONS_MANAGE']);

    return await this.createUser({
      username: 'employee',
      password: 'Employee123!',
      firstName: 'Employee',
      lastName: 'Template',
      roleId: employeeRole.id
    });
  }

  static generateAuthToken(user) {
    return generateToken({
      userId: user.id,
      username: user.username,
      roleId: user.roleId,
      sessionId: 1
    });
  }
}

module.exports = { TestFactory };