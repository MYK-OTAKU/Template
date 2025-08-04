import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock des APIs du navigateur
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock de fetch
global.fetch = vi.fn();

// Mock de ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock de IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Utilitaires de test
export const testUtils = {
  // Mock d'un utilisateur connecté
  mockAuthenticatedUser: {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: {
      id: 1,
      name: 'user',
      permissions: ['users.read']
    }
  },

  // Mock des traductions
  mockTranslations: {
    login: 'Se connecter',
    logout: 'Se déconnecter',
    username: 'Nom d\'utilisateur',
    password: 'Mot de passe',
    dashboard: 'Tableau de bord'
  },

  // Wrapper pour les tests avec contextes
  renderWithProviders: (ui, options = {}) => {
    const { render } = require('@testing-library/react');
    const { BrowserRouter } = require('react-router-dom');
    const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
    
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const AllTheProviders = ({ children }) => {
      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </QueryClientProvider>
      );
    };

    return render(ui, { wrapper: AllTheProviders, ...options });
  }
};

