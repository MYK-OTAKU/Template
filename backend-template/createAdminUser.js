require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initDb } = require('./config/sequelize');
const { User, Role } = require('./models');

const createAdmin = async () => {
  try {
    console.log('Création d\'un administrateur...');
    
    // Connexion à la base de données
    await initDb();
    
    // Vérifier que le rôle Administrateur existe
    const adminRole = await Role.findOne({ where: { name: 'Administrateur' } });
    
    if (!adminRole) {
      console.error('Le rôle Administrateur n\'existe pas. Veuillez d\'abord initialiser les rôles.');
      process.exit(1);
    }
    
    // Données de l'administrateur
    const adminData = {
      username: "MYK",
      password: "MyK91@33837", // Vous pourrez changer ceci
      firstName: "Mohamed",
      lastName: "Koita",
      birthDate: "1990-01-01",
      address: "1 Rue de l'Exemple, Ville",
      phone: "0611223344",
      email: "myk@example.com",
      hireDate: "2023-01-15",
      salary: 2500.5,
      isActive: true,
      roleId: adminRole.id, // Utilisation de l'ID du rôle trouvé
      twoFactorEnabled: false
    };
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { username: adminData.username } });
    
    if (existingUser) {
      console.log('L\'utilisateur existe déjà. Mise à jour du mot de passe...');
      
      // Hacher le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);
      
      // Mettre à jour le mot de passe
      existingUser.password = hashedPassword;
      await existingUser.save();
      
      console.log('Mot de passe mis à jour avec succès.');
      console.log('Utilisateur:', existingUser.username);
      console.log('Mot de passe:', adminData.password);
    } else {
      // Hacher le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);
      
      // Créer l'administrateur
      const newAdmin = await User.create({
        ...adminData,
        password: hashedPassword
      });
      
      console.log('Administrateur créé avec succès:');
      console.log('Utilisateur:', newAdmin.username);
      console.log('Mot de passe:', adminData.password);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
};

createAdmin();