const responses = require('../utils/responses');

const authorize = (roles) => {
  return (req, res, next) => {
    console.log('Roles autorisés:', roles);
    console.log('Role de l\'utilisateur:', req.user?.role?.name || req.userRole);

    // CORRECTION: Utiliser req.userRole (défini par authenticate) au lieu de req.user.role
    // req.user.role est un objet Role, req.userRole est le nom du rôle (string)
    const userRoleName = req.userRole || req.user?.role?.name;

    if (!userRoleName) {
      console.log('❌ Utilisateur sans rôle');
      return responses.unauthorized(res, 'Rôle utilisateur non défini.');
    }

    if (!roles.includes(userRoleName)) {
      console.log('❌ Utilisateur non autorisé - Rôle actuel:', userRoleName);
      return responses.unauthorized(res, 'Vous n\'avez pas les autorisations nécessaires pour effectuer cette action.');
    }
    
    console.log('✅ Autorisation accordée pour le rôle:', userRoleName);
    next();
  };
};

module.exports = authorize;
