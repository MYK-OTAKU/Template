const Utilisateurs = require('../models/Utilisateur');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateToken, verifyToken } = require('../utils/jwt');
const responses = require('../utils/responses');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { sendPasswordResetEmail } = require('../utils/nodemailer');
require('dotenv').config();
const { User, Role, Permission } = require('../models');

// exports.creerUtilisateur = async (req, res) => {
//   try {
//     const { nom, prenom, role, nomUtilisateur, motDePasse, email, numeroTel, adresse, recette } = req.body;
    
//     // Vérifiez que tous les champs requis sont présents
//     if (!nom || !prenom || !role || !nomUtilisateur || !motDePasse || !email) {
//       return res.status(400).json({ message: 'Tous les champs requis doivent être remplis' });
//     }

//     const utilisateur = await Utilisateurs.create({
//       nom,
//       prenom,
//       role,
//       nomUtilisateur,
//       motDePasse,
//       email,
//       numeroTel,
//       adresse,
//       recette
//     });
//     responses.created(res, utilisateur, 'Utilisateur créé avec succès');
//   } catch (error) {
//     console.error('Erreur lors de la création de l\'utilisateur:', error); // Ajoutez ce log pour capturer l'erreur
//     if (error.name === 'SequelizeUniqueConstraintError') {
//       return responses.badRequest(res, 'Email ou nom d’utilisateur déjà utilisé');
//     }
//     responses.badRequest(res, error.message);
//   }
// };

exports.connexion = async (req, res) => {
  try {
    const { nomUtilisateur, motDePasse } = req.body;
    const utilisateur = await Utilisateurs.findOne({ where: { nomUtilisateur } });

    if (!utilisateur) {
      return res.status(404).json({ statut: 'erreur', message: 'Utilisateur non trouvé' });
    }

    console.log('Mot de passe envoyé:', motDePasse); // Mot de passe en texte clair
    console.log('Mot de passe stocké (haché):', utilisateur.motDePasse); // Mot de passe haché stocké

    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    console.log('Mot de passe valide:', motDePasseValide); // Résultat de la comparaison
    if (!motDePasseValide) {
      return res.status(401).json({ statut: 'erreur', message: 'Mot de passe incorrect' });
    }

    if (utilisateur.twoFactorEnabled) {
      const token = generateToken({
        id: utilisateur.id,
        role: utilisateur.role,
        twoFactorRequired: true
      });

      if (utilisateur.qrScanned) {
        return res.status(200).json({ success: true, token, twoFactorRequired: true });
      } else {
        const secret = speakeasy.generateSecret({ length: 20 });
        utilisateur.twoFactorSecret = secret.base32;
        await utilisateur.save();

        const otpauth_url = `otpauth://totp/${process.env.APP_NAME}:${utilisateur.email}?secret=${secret.base32}&issuer=${process.env.APP_NAME}`;
        QRCode.toDataURL(otpauth_url, (err, data_url) => {
          if (err) {
            return res.status(500).json({ message: 'Erreur lors de la génération du QR code' });
          }

          res.status(200).json({ success: true, token, twoFactorRequired: true, qrCodeUrl: data_url });
        });
      }
    } else {
      const token = generateToken({
        id: utilisateur.id,
        role: utilisateur.role
      });
      res.status(200).json({ success: true, token, twoFactorRequired: false });
    }
  } catch (error) {
    res.status(500).json({ statut: 'erreur', message: error.message });
  }
};



exports.verifyTwoFactor = async (req, res) => {
  try {
    const { token, twoFactorCode } = req.body;
    const decoded = verifyToken(token);
    const utilisateur = await Utilisateurs.findByPk(decoded.id);

    if (!utilisateur) {
      console.log('Utilisateur non trouvé');
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    console.log('Horodatage actuel :', Date.now());

    const verified = speakeasy.totp.verify({
      secret: utilisateur.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 1 // Ajoutez une fenêtre de temps pour plus de tolérance
    });

    if (!verified) {
      console.log('Code 2FA incorrect');
      return res.status(401).json({ message: 'Code 2FA incorrect' });
    }

    utilisateur.qrScanned = true; // Marquer le QR code comme scanné
    await utilisateur.save();

    const jwtToken = generateToken({
      id: utilisateur.id,
      role: utilisateur.role // Inclure le rôle ici
    });
    console.log('2FA vérifié avec succès, jeton JWT généré');
    res.status(200).json({ success: true, token: jwtToken });
  } catch (error) {
    console.log('Erreur lors de la vérification 2FA :', error.message);
    res.status(500).json({ message: error.message });
  }
};
exports.getUserProfile = async (req, res) => {
  try {
    // Vérifier que req.user existe
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non authentifié ou mal identifié' 
      });
    }
    
    const userId = req.user.id;
    console.log('ID utilisateur:', userId); // Pour débugger
    
    const utilisateur = await Utilisateurs.findByPk(userId);
    if (utilisateur) {
      // Ne pas renvoyer le mot de passe et autres données sensibles
      const { motDePasse, twoFactorSecret, ...userWithoutSensitiveData } = utilisateur.toJSON();
      return res.status(200).json({
        success: true,
        data: userWithoutSensitiveData
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
  } catch (error) {
    console.error('Erreur dans getUserProfile:', error); // Pour débugger
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

exports.listeUtilisateurs = async (req, res) => {
  try {
    const utilisateurs = await User.findAll({
      attributes: { exclude: ['password', 'twoFactorSecret'] },
      include: [{
        model: Role,
        as: 'role',
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      }]
    });
    
    return res.status(200).json({
      success: true,
      data: utilisateurs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
};

exports.getUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;
    
    const utilisateur = await User.findByPk(id, {
      attributes: { exclude: ['password', 'twoFactorSecret'] },
      include: [{
        model: Role,
        as: 'role',
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      }]
    });
    
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: utilisateur
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message
    });
  }
};

exports.mettreAJourUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      username, firstName, lastName, email, phone, 
      address, birthDate, roleId, isActive 
    } = req.body;
    
    const utilisateur = await User.findByPk(id);
    
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Mise à jour des champs
    if (username) utilisateur.username = username;
    if (firstName) utilisateur.firstName = firstName;
    if (lastName) utilisateur.lastName = lastName;
    if (email !== undefined) utilisateur.email = email;
    if (phone !== undefined) utilisateur.phone = phone;
    if (address !== undefined) utilisateur.address = address;
    if (birthDate !== undefined) utilisateur.birthDate = birthDate;
    if (roleId !== undefined) {
      // Vérifier si le rôle existe
      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Rôle non trouvé'
        });
      }
      utilisateur.roleId = roleId;
    }
    if (isActive !== undefined) utilisateur.isActive = isActive;
    
    await utilisateur.save();
    
    // Récupérer l'utilisateur mis à jour avec son rôle et ses permissions
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password', 'twoFactorSecret'] },
      include: [{
        model: Role,
        as: 'role',
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      }]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: updatedUser
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'utilisateur ou email déjà utilisé',
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error.message
    });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    
    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur et ID rôle sont requis'
      });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rôle non trouvé'
      });
    }
    
    user.roleId = roleId;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Rôle de l\'utilisateur modifié avec succès',
      data: {
        userId: user.id,
        username: user.username,
        newRoleId: roleId,
        newRoleName: role.name
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du rôle',
      error: error.message
    });
  }
};

exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    user.isActive = true;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Utilisateur activé avec succès',
      data: { id: user.id, username: user.username, isActive: true }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation de l\'utilisateur',
      error: error.message
    });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    user.isActive = false;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Utilisateur désactivé avec succès',
      data: { id: user.id, username: user.username, isActive: false }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation de l\'utilisateur',
      error: error.message
    });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const utilisateur = await Utilisateurs.findOne({ where: { email } });

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const resetToken = generateToken({ id: utilisateur.id, token });

    // Lien vers le frontend
    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

    await sendPasswordResetEmail(email, resetLink);

    res.status(200).json({ message: 'Email de réinitialisation envoyé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const decoded = verifyToken(token);
    const utilisateur = await Utilisateurs.findByPk(decoded.id);

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    utilisateur.motDePasse = newPassword;
    await utilisateur.save();

    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.logout = async (req, res) => {
  res.status(200).json({ message: 'Déconnexion réussie' });
};

exports.enableTwoFactor = async (req, res) => {
  try {
    const { userId } = req.user;
    const utilisateur = await Utilisateurs.findByPk(userId);

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const secret = speakeasy.generateSecret({ length: 20 });
    utilisateur.twoFactorSecret = secret.base32;
    utilisateur.twoFactorEnabled = true;
    await utilisateur.save();

    const otpauth_url = `otpauth://totp/${process.env.APP_NAME}:${utilisateur.email}?secret=${secret.base32}&issuer=${process.env.APP_NAME}`;

    QRCode.toDataURL(otpauth_url, (err, data_url) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la génération du QR code' });
      }

      res.status(200).json({ message: '2FA activé', qrCodeUrl: data_url });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ajouter cette méthode qui est utilisée dans les routes mais manquante

exports.supprimerUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier si l'utilisateur est un admin et s'il n'est pas le dernier admin
    if (user.role && user.role.name === 'Administrateur') {
      const adminCount = await User.count({
        include: [{
          model: Role,
          as: 'role',
          where: { name: 'Administrateur' }
        }]
      });
      
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de supprimer le dernier administrateur'
        });
      }
    }
    
    await user.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message
    });
  }
};
