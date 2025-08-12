import Cookies from 'js-cookie';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Constantes
const AUTH_TOKEN_KEY = 'authToken';
const STORAGE_KEYS = {
  SHOW_TYPE: 'showType',
  SEARCH: 'search',
};

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Função para validar token (pode ser expandida futuramente)
  const validateToken = useCallback((token) => {
    return token && token.length > 0;
  }, []);

  // Verificar autenticação inicial
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = Cookies.get(AUTH_TOKEN_KEY);
        if (token && validateToken(token)) {
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        setError('Erro ao verificar autenticação');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [validateToken]);

  const login = useCallback(
    (token) => {
      try {
        if (!token || !validateToken(token)) {
          throw new Error('Token inválido');
        }

        Cookies.set(AUTH_TOKEN_KEY, token, {
          expires: 7, // Token expira em 7 dias
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });

        setIsLoggedIn(true);
        setError(null);
        navigate('/');
      } catch (err) {
        console.error('Erro no login:', err);
        setError(err.message);
      }
    },
    [navigate, validateToken]
  );

  const logout = useCallback(async () => {
    try {
      // Limpar cookie de autenticação
      Cookies.remove(AUTH_TOKEN_KEY);

      // Limpar dados do localStorage e sessionStorage
      localStorage.removeItem(STORAGE_KEYS.SHOW_TYPE);
      sessionStorage.removeItem(STORAGE_KEYS.SEARCH);

      setIsLoggedIn(false);
      setError(null);

      // Opcional: navegar para login após logout
      navigate('/login');
    } catch (err) {
      console.error('Erro no logout:', err);
      setError('Erro ao fazer logout');
    }
  }, [navigate]);

  // Função para limpar erros
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoizar o valor do contexto para evitar re-renders desnecessários
  const contextValue = useMemo(
    () => ({
      isLoggedIn,
      isLoading,
      error,
      login,
      logout,
      clearError,
    }),
    [isLoggedIn, isLoading, error, login, logout, clearError]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
