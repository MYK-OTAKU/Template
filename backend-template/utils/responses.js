module.exports = {
  success: (res, data, message = 'Succès') => {
    res.status(200).json({
      statut: 'succès',
      message,
      données: data
    });
  },

  created: (res, data, message = 'Ressource créée avec succès') => {
    res.status(201).json({
      statut: 'succès',
      message,
      données: data
    });
  },

  badRequest: (res, error, message = 'Requête incorrecte') => {
    res.status(400).json({
      statut: 'erreur',
      message,
      erreur: error
    });
  },

  unauthorized: (res, error, message = 'Non autorisé') => {
    res.status(401).json({
      statut: 'erreur',
      message,
      erreur: error
    });
  },

  notFound: (res, error, message = 'Ressource non trouvée') => {
    res.status(404).json({
      statut: 'erreur',
      message,
      erreur: error
    });
  },

  serverError: (res, error, message = 'Erreur interne du serveur') => {
    res.status(500).json({
      statut: 'erreur',
      message,
      erreur: error
    });
  }
};
