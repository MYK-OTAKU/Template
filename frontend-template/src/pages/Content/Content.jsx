import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../hooks/useNotification';
import { Package, Plus, Edit3, Trash2, Search, Filter, Eye } from 'lucide-react';

const Content = () => {
  const { translations } = useLanguage();
  const { showSuccess, showError } = useNotification();
  
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);

  // Fonction pour générer des données de démonstration multilingues
  const getMockContents = () => [
    {
      id: 1,
      name: translations?.content?.mockContent1Name || 'Article de blog principal',
      type: translations?.content?.mockContent1Type || 'Article',
      description: translations?.content?.mockContent1Desc || 'Article principal sur la page d\'accueil',
      status: translations?.content?.statusPublished || 'Publié',
      dateCreated: '2024-01-15',
      author: 'Admin'
    },
    {
      id: 2,
      name: translations?.content?.mockContent2Name || 'Bannière promotionnelle',
      type: translations?.content?.mockContent2Type || 'Media',
      description: translations?.content?.mockContent2Desc || 'Bannière pour les promotions du mois',
      status: translations?.content?.statusDraft || 'Brouillon',
      dateCreated: '2024-01-10',
      author: 'Manager'
    },
    {
      id: 3,
      name: translations?.content?.mockContent3Name || 'Guide utilisateur',
      type: translations?.content?.mockContent3Type || 'Documentation',
      description: translations?.content?.mockContent3Desc || 'Guide complet d\'utilisation de la plateforme',
      status: translations?.content?.statusPublished || 'Publié',
      dateCreated: '2024-01-05',
      author: 'Admin'
    }
  ];

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    setLoading(true);
    try {
      // Simulation de chargement
      await new Promise(resolve => setTimeout(resolve, 500));
      setContents(getMockContents());
    } catch (error) {
      showError('Erreur lors du chargement du contenu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContent = () => {
    setEditingContent(null);
    setShowModal(true);
  };

  const handleEditContent = (content) => {
    setEditingContent(content);
    setShowModal(true);
  };

  const handleDeleteContent = async (contentId) => {
    if (window.confirm(translations?.content?.deleteConfirmation || 'Êtes-vous sûr de vouloir supprimer ce contenu ?')) {
      try {
        setContents(prev => prev.filter(c => c.id !== contentId));
        showSuccess(translations?.content?.contentDeleted || 'Contenu supprimé avec succès');
      } catch (error) {
        showError('Erreur lors de la suppression');
      }
    }
  };

  const handleSaveContent = async (contentData) => {
    try {
      if (editingContent) {
        // Modification
        setContents(prev => prev.map(c => 
          c.id === editingContent.id 
            ? { ...c, ...contentData, dateModified: new Date().toISOString().split('T')[0] }
            : c
        ));
        showSuccess(translations?.content?.contentUpdated || 'Contenu mis à jour avec succès');
      } else {
        // Création
        const newContent = {
          id: Date.now(),
          ...contentData,
          dateCreated: new Date().toISOString().split('T')[0],
          author: 'Current User'
        };
        setContents(prev => [newContent, ...prev]);
        showSuccess(translations?.content?.contentCreated || 'Contenu créé avec succès');
      }
      setShowModal(false);
    } catch (error) {
      showError('Erreur lors de la sauvegarde');
    }
  };

  const filteredContents = contents.filter(content => {
    const matchesSearch = content.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || content.type === selectedType;
    return matchesSearch && matchesType;
  });

  const contentTypes = ['all', 'Article', 'Media', 'Documentation'];

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="text-blue-600" />
            {translations?.content?.title || 'Gestion du contenu'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez vos articles, médias et documents
          </p>
        </div>
        <button
          onClick={handleCreateContent}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          {translations?.content?.addContent || 'Ajouter du contenu'}
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher du contenu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {contentTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'Tous les types' : type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des contenus */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun contenu</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Commencez par créer votre premier contenu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContents.map((content) => (
                  <tr key={content.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {content.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Par {content.author}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {content.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {content.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        content.status === 'Publié' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {content.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(content.dateCreated).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditContent(content)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Modifier"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteContent(content.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {showModal && (
        <ContentModal
          content={editingContent}
          onSave={handleSaveContent}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

// Modal pour créer/éditer du contenu
const ContentModal = ({ content, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: content?.name || '',
    type: content?.type || 'Article',
    description: content?.description || '',
    status: content?.status || 'Brouillon'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {content ? 'Modifier le contenu' : 'Créer un nouveau contenu'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom du contenu *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type de contenu
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="Article">Article</option>
              <option value="Media">Media</option>
              <option value="Documentation">Documentation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="Brouillon">Brouillon</option>
              <option value="Publié">Publié</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {content ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Content;
