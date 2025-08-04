const responses = require('../utils/responses');

const authorize = (roles) => {
  return (req, res, next) => {
    console.log('Roles autorisés:', roles);
    console.log('Role de l\'utilisateur:', req.user.role);

    if (!roles.includes(req.user.role)) {
      console.log('Utilisateur non autorisé');
      return responses.unauthorized(res, 'Vous n\'avez pas les autorisations nécessaires pour effectuer cette action.');
    }
    next();
  };
};

module.exports = authorize;
