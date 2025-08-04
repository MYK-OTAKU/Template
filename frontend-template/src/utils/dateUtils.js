/**
 * Utilitaires pour la gestion des dates
 */

/**
 * Formate une date de manière sécurisée
 * @param {string|Date|number} timestamp - Le timestamp à formater
 * @param {Object} options - Options de formatage
 * @returns {string} - Date formatée ou 'Date invalide'
 */
export const formatDate = (timestamp, options = {}) => {
  try {
    // Si pas de timestamp, retourner une valeur par défaut
    if (!timestamp) {
      return 'Date non disponible';
    }

    let date;
    
    // Gérer différents types de timestamp
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      // Essayer de parser la string
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      // Si c'est un nombre, l'utiliser comme timestamp
      date = new Date(timestamp);
    } else {
      throw new Error('Format de timestamp non supporté');
    }

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.warn('Timestamp invalide:', timestamp);
      return 'Date invalide';
    }

    // Options par défaut
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };

    const formatOptions = { ...defaultOptions, ...options };

    // Formater la date
    return date.toLocaleString('fr-FR', formatOptions);
    
  } catch (error) {
    console.warn('Erreur lors du formatage de la date:', { timestamp, error });
    return 'Date invalide';
  }
};

/**
 * Formate une date relative (il y a X minutes/heures/jours)
 * @param {string|Date|number} timestamp - Le timestamp à formater
 * @returns {string} - Date relative formatée
 */
export const formatRelativeDate = (timestamp) => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) {
      return 'À l\'instant';
    } else if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return formatDate(timestamp, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  } catch (error) {
    console.warn('Erreur lors du formatage de la date relative:', { timestamp, error });
    return 'Date invalide';
  }
};

/**
 * Valide et nettoie un timestamp
 * @param {*} timestamp - Le timestamp à valider
 * @returns {string|null} - Timestamp ISO valide ou null
 */
export const validateTimestamp = (timestamp) => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch (err) {
    console.warn('Erreur lors de la validation du timestamp:', { timestamp, err });
    return null;
  }
};
