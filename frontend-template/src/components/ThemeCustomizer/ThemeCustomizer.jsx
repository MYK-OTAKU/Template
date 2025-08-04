import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Palette, Sun, Moon, Monitor, RotateCcw, Check, X } from 'lucide-react';

const ThemeCustomizer = ({ isOpen, onClose }) => {
  const { theme, setTheme, availableThemes, effectiveTheme } = useTheme();
  const { translations } = useLanguage();
  const [customColors, setCustomColors] = useState({
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    accent: '#ec4899'
  });
  const [fontSize, setFontSize] = useState('medium');
  const [previewMode, setPreviewMode] = useState(false);

  // Charger les paramètres personnalisés depuis localStorage
  useEffect(() => {
    const savedColors = localStorage.getItem('customThemeColors');
    const savedFontSize = localStorage.getItem('customFontSize');
    
    if (savedColors) {
      setCustomColors(JSON.parse(savedColors));
    }
    if (savedFontSize) {
      setFontSize(savedFontSize);
    }
  }, []);

  // Appliquer les couleurs personnalisées
  const applyCustomColors = () => {
    const root = document.documentElement;
    
    // Convertir hex en RGB pour les variables CSS
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const primaryRgb = hexToRgb(customColors.primary);
    const secondaryRgb = hexToRgb(customColors.secondary);
    const accentRgb = hexToRgb(customColors.accent);

    if (primaryRgb) {
      root.style.setProperty('--color-primary', `${primaryRgb.r} ${primaryRgb.g} ${primaryRgb.b}`);
    }
    if (secondaryRgb) {
      root.style.setProperty('--color-secondary', `${secondaryRgb.r} ${secondaryRgb.g} ${secondaryRgb.b}`);
    }
    if (accentRgb) {
      root.style.setProperty('--color-accent', `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}`);
    }

    // Appliquer la taille de police
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--font-size-base', fontSizes[fontSize]);

    // Sauvegarder dans localStorage
    localStorage.setItem('customThemeColors', JSON.stringify(customColors));
    localStorage.setItem('customFontSize', fontSize);
  };

  // Réinitialiser le thème
  const resetTheme = () => {
    const root = document.documentElement;
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-secondary');
    root.style.removeProperty('--color-accent');
    root.style.removeProperty('--font-size-base');
    
    localStorage.removeItem('customThemeColors');
    localStorage.removeItem('customFontSize');
    
    setCustomColors({
      primary: '#8b5cf6',
      secondary: '#06b6d4',
      accent: '#ec4899'
    });
    setFontSize('medium');
  };

  // Gérer la prévisualisation
  const togglePreview = () => {
    if (previewMode) {
      // Arrêter la prévisualisation
      setPreviewMode(false);
    } else {
      // Commencer la prévisualisation
      setPreviewMode(true);
      applyCustomColors();
    }
  };

  // Appliquer définitivement
  const applyTheme = () => {
    applyCustomColors();
    setPreviewMode(false);
    onClose();
  };

  if (!isOpen) return null;

  const isDarkMode = effectiveTheme === 'dark';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold">
              {translations.themeCustomization || 'Personnalisation du thème'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full hover:bg-gray-200 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sélection du thème de base */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">
            {translations.themeSettings || 'Paramètres du thème'}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {availableThemes.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => setTheme(themeOption.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  theme === themeOption.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900'
                    : isDarkMode
                    ? 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  {themeOption.value === 'light' && <Sun className="w-5 h-5" />}
                  {themeOption.value === 'dark' && <Moon className="w-5 h-5" />}
                  {themeOption.value === 'auto' && <Monitor className="w-5 h-5" />}
                  <span className="text-xs">{themeOption.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Couleurs personnalisées */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">
            {translations.themeCustomization || 'Couleurs personnalisées'}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">
                {translations.themeColorPrimary || 'Couleur principale'}
              </label>
              <input
                type="color"
                value={customColors.primary}
                onChange={(e) => setCustomColors(prev => ({ ...prev, primary: e.target.value }))}
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">
                {translations.themeColorSecondary || 'Couleur secondaire'}
              </label>
              <input
                type="color"
                value={customColors.secondary}
                onChange={(e) => setCustomColors(prev => ({ ...prev, secondary: e.target.value }))}
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">
                {translations.themeColorAccent || 'Couleur d\'accent'}
              </label>
              <input
                type="color"
                value={customColors.accent}
                onChange={(e) => setCustomColors(prev => ({ ...prev, accent: e.target.value }))}
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Taille de police */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">
            {translations.themeFontSize || 'Taille de police'}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {['small', 'medium', 'large'].map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`p-2 rounded border-2 transition-all text-sm ${
                  fontSize === size
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900'
                    : isDarkMode
                    ? 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {translations[`themeFontSize${size.charAt(0).toUpperCase() + size.slice(1)}`] || size}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={togglePreview}
            className={`flex-1 py-2 px-4 rounded-lg border transition-all ${
              previewMode
                ? 'bg-yellow-500 text-white border-yellow-500'
                : isDarkMode
                ? 'border-gray-600 hover:border-gray-500'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {previewMode 
              ? (translations.themePreview || 'Aperçu actif')
              : (translations.themePreview || 'Aperçu')
            }
          </button>
          
          <button
            onClick={resetTheme}
            className={`p-2 rounded-lg border transition-all ${
              isDarkMode
                ? 'border-gray-600 hover:border-gray-500'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            title={translations.themeReset || 'Réinitialiser'}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button
            onClick={applyTheme}
            className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all"
            title={translations.themeApply || 'Appliquer'}
          >
            <Check className="w-5 h-5" />
          </button>
        </div>

        {/* Note de prévisualisation */}
        {previewMode && (
          <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Mode aperçu activé. Cliquez sur "Appliquer" pour sauvegarder les modifications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeCustomizer;

