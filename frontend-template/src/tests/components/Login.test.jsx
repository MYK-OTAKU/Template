import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testUtils } from '../setup';
import Login from '../../components/Login/Login';

// Mock des modules
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    isLoading: false,
    error: null
  })
}));

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    translations: testUtils.mockTranslations,
    t: (key) => testUtils.mockTranslations[key] || key
  })
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn()
  })
}));

describe('Login Component', () => {
  let mockLogin;
  let user;

  beforeEach(() => {
    mockLogin = vi.fn();
    user = userEvent.setup();
    
    // Reset des mocks
    vi.clearAllMocks();
    
    // Mock du contexte d'authentification
    vi.doMock('../../contexts/AuthContext', () => ({
      useAuth: () => ({
        login: mockLogin,
        isLoading: false,
        error: null
      })
    }));
  });

  test('should render login form correctly', () => {
    testUtils.renderWithProviders(<Login />);

    // Vérifier la présence des éléments du formulaire
    expect(screen.getByLabelText(/nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  test('should handle form submission with valid credentials', async () => {
    mockLogin.mockResolvedValue({ success: true });
    
    testUtils.renderWithProviders(<Login />);

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    // Saisir les identifiants
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');

    // Soumettre le formulaire
    await user.click(submitButton);

    // Vérifier que la fonction login a été appelée
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  test('should show validation errors for empty fields', async () => {
    testUtils.renderWithProviders(<Login />);

    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    // Soumettre le formulaire sans saisir de données
    await user.click(submitButton);

    // Vérifier les messages d'erreur
    await waitFor(() => {
      expect(screen.getByText(/nom d'utilisateur requis/i)).toBeInTheDocument();
      expect(screen.getByText(/mot de passe requis/i)).toBeInTheDocument();
    });

    // Vérifier que login n'a pas été appelé
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('should show error message on login failure', async () => {
    const errorMessage = 'Identifiants invalides';
    mockLogin.mockRejectedValue(new Error(errorMessage));

    testUtils.renderWithProviders(<Login />);

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    // Saisir des identifiants invalides
    await user.type(usernameInput, 'wronguser');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    // Vérifier l'affichage du message d'erreur
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('should disable form during loading', async () => {
    // Mock du contexte avec isLoading = true
    vi.doMock('../../contexts/AuthContext', () => ({
      useAuth: () => ({
        login: mockLogin,
        isLoading: true,
        error: null
      })
    }));

    testUtils.renderWithProviders(<Login />);

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    // Vérifier que les champs sont désactivés
    expect(usernameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  test('should toggle password visibility', async () => {
    testUtils.renderWithProviders(<Login />);

    const passwordInput = screen.getByLabelText(/mot de passe/i);
    const toggleButton = screen.getByRole('button', { name: /afficher le mot de passe/i });

    // Vérifier que le mot de passe est masqué par défaut
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Cliquer sur le bouton pour afficher le mot de passe
    await user.click(toggleButton);

    // Vérifier que le mot de passe est maintenant visible
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Cliquer à nouveau pour masquer
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should handle remember me checkbox', async () => {
    testUtils.renderWithProviders(<Login />);

    const rememberCheckbox = screen.getByLabelText(/se souvenir de moi/i);

    // Vérifier l'état initial
    expect(rememberCheckbox).not.toBeChecked();

    // Cocher la case
    await user.click(rememberCheckbox);
    expect(rememberCheckbox).toBeChecked();

    // Décocher la case
    await user.click(rememberCheckbox);
    expect(rememberCheckbox).not.toBeChecked();
  });

  test('should handle keyboard navigation', async () => {
    testUtils.renderWithProviders(<Login />);

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    // Commencer par le champ nom d'utilisateur
    usernameInput.focus();
    expect(usernameInput).toHaveFocus();

    // Naviguer avec Tab
    await user.tab();
    expect(passwordInput).toHaveFocus();

    await user.tab();
    expect(submitButton).toHaveFocus();
  });

  test('should submit form on Enter key press', async () => {
    mockLogin.mockResolvedValue({ success: true });
    
    testUtils.renderWithProviders(<Login />);

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);

    // Saisir les identifiants
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');

    // Appuyer sur Entrée dans le champ mot de passe
    await user.keyboard('{Enter}');

    // Vérifier que la fonction login a été appelée
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  test('should prevent multiple submissions', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    testUtils.renderWithProviders(<Login />);

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    // Saisir les identifiants
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');

    // Cliquer plusieurs fois rapidement
    await user.click(submitButton);
    await user.click(submitButton);
    await user.click(submitButton);

    // Vérifier que login n'a été appelé qu'une seule fois
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  test('should handle 2FA requirement', async () => {
    mockLogin.mockResolvedValue({ 
      success: true, 
      requiresTwoFactor: true,
      tempToken: 'temp_token_123'
    });
    
    testUtils.renderWithProviders(<Login />);

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    // Saisir les identifiants
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Vérifier l'affichage du formulaire 2FA
    await waitFor(() => {
      expect(screen.getByText(/authentification à deux facteurs/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/code de vérification/i)).toBeInTheDocument();
    });
  });

  test('should sanitize input values', async () => {
    testUtils.renderWithProviders(<Login />);

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const maliciousInput = '<script>alert("xss")</script>';

    // Saisir du contenu potentiellement malveillant
    await user.type(usernameInput, maliciousInput);

    // Vérifier que la valeur est nettoyée
    expect(usernameInput.value).not.toContain('<script>');
  });

  test('should handle network errors gracefully', async () => {
    mockLogin.mockRejectedValue(new Error('Network Error'));
    
    testUtils.renderWithProviders(<Login />);

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Vérifier l'affichage d'un message d'erreur réseau
    await waitFor(() => {
      expect(screen.getByText(/erreur de connexion/i)).toBeInTheDocument();
    });
  });

  test('should clear error message on input change', async () => {
    // Simuler une erreur initiale
    vi.doMock('../../contexts/AuthContext', () => ({
      useAuth: () => ({
        login: mockLogin,
        isLoading: false,
        error: 'Identifiants invalides'
      })
    }));

    testUtils.renderWithProviders(<Login />);

    // Vérifier que l'erreur est affichée
    expect(screen.getByText(/identifiants invalides/i)).toBeInTheDocument();

    // Modifier un champ
    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    await user.type(usernameInput, 'a');

    // Vérifier que l'erreur a été effacée
    await waitFor(() => {
      expect(screen.queryByText(/identifiants invalides/i)).not.toBeInTheDocument();
    });
  });
});

