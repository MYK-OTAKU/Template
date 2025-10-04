import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../hooks/useNotification';
import { BarChart3, TrendingUp, Download, Calendar, Filter, Eye, PieChart, Users, Activity } from 'lucide-react';

const Reports = () => {
  const { translations } = useLanguage();
  const { showSuccess, showError } = useNotification();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState({});

  // Données de démonstration
  const mockReports = [
    {
      id: 1,
      name: 'Rapport d\'activité mensuel',
      type: 'Activité',
      description: 'Analyse complète de l\'activité du mois',
      period: 'monthly',
      dateGenerated: '2024-01-15',
      size: '2.4 MB',
      format: 'PDF'
    },
    {
      id: 2,
      name: 'Statistiques utilisateurs',
      type: 'Utilisateurs',
      description: 'Rapport détaillé sur les utilisateurs actifs',
      period: 'weekly',
      dateGenerated: '2024-01-10',
      size: '1.8 MB',
      format: 'Excel'
    },
    {
      id: 3,
      name: 'Analyse de performance',
      type: 'Performance',
      description: 'Métriques de performance système',
      period: 'daily',
      dateGenerated: '2024-01-08',
      size: '892 KB',
      format: 'PDF'
    }
  ];

  const mockStats = {
    totalReports: 156,
    todayReports: 12,
    weeklyGrowth: 8.5,
    popularFormat: 'PDF'
  };

  useEffect(() => {
    loadReports();
    loadStats();
  }, [selectedPeriod, selectedCategory]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Simulation de chargement
      await new Promise(resolve => setTimeout(resolve, 500));
      setReports(mockReports);
    } catch (error) {
      showError('Erreur lors du chargement des rapports');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStats(mockStats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      // Simulation de génération
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport = {
        id: Date.now(),
        name: `Rapport personnalisé ${new Date().toLocaleDateString('fr-FR')}`,
        type: 'Personnalisé',
        description: 'Rapport généré sur mesure',
        period: selectedPeriod,
        dateGenerated: new Date().toISOString().split('T')[0],
        size: '1.2 MB',
        format: 'PDF'
      };
      
      setReports(prev => [newReport, ...prev]);
      showSuccess(translations?.reports?.reportGenerated || 'Rapport généré avec succès');
    } catch (error) {
      showError('Erreur lors de la génération du rapport');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      // Simulation de téléchargement
      showSuccess('Téléchargement commencé');
      console.log('Téléchargement du rapport:', reportId);
    } catch (error) {
      showError('Erreur lors du téléchargement');
      console.error('Erreur:', error);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesPeriod = selectedPeriod === 'all' || report.period === selectedPeriod;
    const matchesCategory = selectedCategory === 'all' || report.type === selectedCategory;
    return matchesPeriod && matchesCategory;
  });

  const periods = [
    { value: 'all', label: 'Toutes les périodes' },
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuel' },
    { value: 'yearly', label: 'Annuel' }
  ];

  const categories = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'Activité', label: 'Activité' },
    { value: 'Utilisateurs', label: 'Utilisateurs' },
    { value: 'Performance', label: 'Performance' },
    { value: 'Personnalisé', label: 'Personnalisé' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-blue-600" />
            {translations?.reports?.title || 'Rapports'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Générez et consultez vos rapports d'analyse
          </p>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <TrendingUp size={20} />
          {loading ? 'Génération...' : (translations?.reports?.generateReport || 'Générer un rapport')}
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rapports</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReports || 0}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayReports || 0}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Croissance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                +{stats.weeklyGrowth || 0}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Format Populaire</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.popularFormat || 'PDF'}</p>
            </div>
            <PieChart className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des rapports */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun rapport</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Générez votre premier rapport pour commencer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nom du rapport
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Taille
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {report.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {report.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {periods.find(p => p.value === report.period)?.label || report.period}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(report.dateGenerated).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <span>{report.size}</span>
                        <span className="text-xs text-gray-400">({report.format})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadReport(report.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                          title="Télécharger"
                        >
                          <Download size={16} />
                          Télécharger
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
    </div>
  );
};

export default Reports;
