import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Shield, 
  Key, 
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  UserCheck,
  CheckCircle,
  Settings,
  Monitor
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'purple', trend }) => {
  const { effectiveTheme } = useTheme();
  const isDarkMode = effectiveTheme === 'dark';

  const colorClasses = {
    purple: 'from-purple-600 to-blue-600',
    green: 'from-green-600 to-teal-600',
    orange: 'from-orange-600 to-red-600',
    blue: 'from-blue-600 to-indigo-600',
    red: 'from-red-600 to-pink-600'
  };

  const getTextColorClass = (isPrimary) => isDarkMode ? (isPrimary ? 'text-white' : 'text-gray-300') : (isPrimary ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]');
  const getBorderColorClass = () => isDarkMode ? 'border-purple-400/20' : 'border-[var(--border-color)]';
  const getCardBgClass = () => 'var(--background-card)';

  return (
    <div 
      className={`p-6 rounded-xl border ${getBorderColorClass()} hover:border-purple-400/40 transition-all duration-300 transform hover:scale-105`}
      style={{
        background: getCardBgClass(),
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div 
            className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]} shadow-lg`}
          >
            <Icon size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${getTextColorClass(false)}`}>{title}</h3>
            <p className={`text-2xl font-bold ${getTextColorClass(true)}`}>{value}</p>
            {subtitle && (
              <p className={`text-xs ${getTextColorClass(false)} mt-1`}>{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.positive ? <TrendingUp size={16} /> : <TrendingUp size={16} className="rotate-180" />}
            <span className="ml-1">{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const QuickActionCard = ({ title, description, icon: Icon, onClick, color = 'purple' }) => {
  const { effectiveTheme } = useTheme();
  const isDarkMode = effectiveTheme === 'dark';

  const colorClasses = {
    purple: 'from-purple-600 to-blue-600',
    green: 'from-green-600 to-teal-600',
    orange: 'from-orange-600 to-red-600',
    blue: 'from-blue-600 to-indigo-600',
    red: 'from-red-600 to-pink-600'
  };

  const getTextColorClass = (isPrimary) => isDarkMode ? (isPrimary ? 'text-white' : 'text-gray-300') : (isPrimary ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]');
  const getBorderColorClass = () => isDarkMode ? 'border-purple-400/20' : 'border-[var(--border-color)]';
  const getCardBgClass = () => 'var(--background-card)';

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-xl border ${getBorderColorClass()} hover:border-purple-400/40 transition-all duration-300 transform hover:scale-105 cursor-pointer`}
      style={{
        background: getCardBgClass(),
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="flex items-center space-x-4">
        <div 
          className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]} shadow-lg`}
        >
          <Icon size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${getTextColorClass(true)} mb-2`}>{title}</h3>
          <p className={`text-sm ${getTextColorClass(false)}`}>{description}</p>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const { user, hasPermission } = useAuth();
  const { translations, getTranslation } = useLanguage();
  const { effectiveTheme } = useTheme();
  const navigate = useNavigate();
  const [realTimeData, setRealTimeData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    activePermissions: 0,
    systemUptime: '00:00:00'
  });

  const isDarkMode = effectiveTheme === 'dark';

  // Simulation de données en temps réel
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        // Simulation d'un appel API pour obtenir des données réelles
        setRealTimeData({
          totalUsers: 47,
          activeUsers: 12,
          totalRoles: 3,
          activePermissions: 15,
          systemUptime: new Date().toLocaleTimeString()
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    fetchRealData();
    const interval = setInterval(fetchRealData, 30000); // Mise à jour toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  // Quick actions available based on permissions
  const quickActions = [
    {
      title: translations?.userManagement || 'User Management',
      description: translations?.manageUserAccounts || 'Create and manage user accounts',
      icon: Users,
      permission: 'USERS_VIEW',
      color: 'purple',
      path: '/dashboard/users'
    },
    {
      title: translations?.roleManagement || 'Role Management',
      description: translations?.configureRolesAndPermissions || 'Configure roles and permissions',
      icon: Shield,
      permission: 'ROLES_VIEW',
      color: 'green',
      path: '/dashboard/roles'
    },
    {
      title: translations?.permissions || 'Permissions',
      description: translations?.manageSystemPermissions || 'Gérer les permissions système',
      icon: Key,
      permission: 'PERMISSIONS_VIEW',
      color: 'blue',
      path: '/dashboard/permissions'
    },
    {
      title: getTranslation('settings.title', 'Paramètres'),
      description: getTranslation('settings.description', 'Configuration du système'),
      icon: Settings,
      permission: null, // Accessible à tous
      color: 'orange',
      path: '/dashboard/settings'
    },
    {
      title: getTranslation('monitoring.title', 'Monitoring'),
      description: getTranslation('monitoring.description', 'Monitor user sessions and activities'),
      icon: Monitor,
      permission: 'MONITORING_VIEW',
      color: 'red',
      path: '/dashboard/monitoring'
    }
  ].filter(action => !action.permission || hasPermission(action.permission) || hasPermission('ADMIN'));

  const getTextColorClass = (isPrimary) => isDarkMode ? (isPrimary ? 'text-white' : 'text-gray-300') : (isPrimary ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]');

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--background-app)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${getTextColorClass(true)} mb-2`}>
            {translations?.dashboardWelcome || 'Welcome to your dashboard'}
          </h1>
          <p className={`${getTextColorClass(false)} text-lg`}>
            {translations?.welcomeMessage || `Hello ${user?.username || 'User'}, here's an overview of your system.`}
          </p>
        </div>

        {/* Main statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title={translations?.totalUsers || "Total Users"}
            value={realTimeData.totalUsers.toString()}
            subtitle={translations?.registeredUsers || "registered users"}
            color="purple"
            trend={{ positive: true, value: "+3 this week" }}
          />
          <StatCard
            icon={UserCheck}
            title={translations?.activeUsers || "Active Users"}
            value={realTimeData.activeUsers.toString()}
            subtitle={translations?.currentlyOnline || "actuellement en ligne"}
            color="green"
            trend={{ positive: true, value: "+2" }}
          />
          <StatCard
            icon={Shield}
            title={translations?.configuredRoles || "Configured Roles"}
            value={realTimeData.totalRoles.toString()}
            subtitle={translations?.systemRoles || "rôles système"}
            color="blue"
          />
          <StatCard
            icon={Key}
            title={translations?.activePermissions || "Permissions Actives"}
            value={realTimeData.activePermissions.toString()}
            subtitle={translations?.securityPermissions || "permissions de sécurité"}
            color="orange"
          />
        </div>

        {/* Informations système */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div 
            className="p-6 rounded-xl border border-purple-400/20 col-span-1"
            style={{ background: 'var(--background-card)' }}
          >
            <h3 className={`text-lg font-semibold ${getTextColorClass(true)} mb-4 flex items-center`}>
              <Activity className="mr-2" size={20} />
              {translations?.systemStatus || 'État du Système'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={getTextColorClass(false)}>
                  {translations?.systemUptime || 'Temps de fonctionnement'}
                </span>
                <span className="text-green-500 flex items-center">
                  <CheckCircle size={16} className="mr-1" />
                  {realTimeData.systemUptime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={getTextColorClass(false)}>
                  {translations?.databaseStatus || 'Base de données'}
                </span>
                <span className="text-green-500 flex items-center">
                  <CheckCircle size={16} className="mr-1" />
                  {translations?.online || 'En ligne'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={getTextColorClass(false)}>
                  {translations?.lastBackup || 'Dernière sauvegarde'}
                </span>
                <span className={`${getTextColorClass(false)} text-sm`}>
                  {translations?.today || 'Aujourd\'hui'}
                </span>
              </div>
            </div>
          </div>

          {/* Activité récente */}
          <div 
            className="p-6 rounded-xl border border-purple-400/20 col-span-2"
            style={{ background: 'var(--background-card)' }}
          >
            <h3 className={`text-lg font-semibold ${getTextColorClass(true)} mb-4 flex items-center`}>
              <Clock className="mr-2" size={20} />
              {translations?.recentActivity || 'Activité Récente'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={`${getTextColorClass(false)} text-sm`}>
                  {translations?.userLoggedIn || 'Utilisateur connecté'} - Admin (il y a 5 min)
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className={`${getTextColorClass(false)} text-sm`}>
                  {translations?.roleUpdated || 'Rôle mis à jour'} - Manager (il y a 15 min)
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className={`${getTextColorClass(false)} text-sm`}>
                  {translations?.systemBackup || 'Sauvegarde système'} (il y a 2h)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold ${getTextColorClass(true)} mb-6`}>
            {translations?.quickActions || 'Quick Actions'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                title={action.title}
                description={action.description}
                icon={action.icon}
                color={action.color}
                onClick={() => navigate(action.path)}
              />
            ))}
          </div>
        </div>

        {/* Alertes système */}
        <div 
          className="p-6 rounded-xl border border-orange-400/20"
          style={{ background: 'var(--background-card)' }}
        >
          <h3 className={`text-lg font-semibold ${getTextColorClass(true)} mb-4 flex items-center`}>
            <AlertCircle className="mr-2 text-orange-500" size={20} />
            {translations?.systemAlerts || 'Alertes Système'}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
              <span className={`${getTextColorClass(false)} text-sm`}>
                {translations?.noAlertsMessage || 'Aucune alerte système active'}
              </span>
              <CheckCircle size={16} className="text-green-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
