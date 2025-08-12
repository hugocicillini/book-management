import axios from 'axios';
import { useCallback, useContext, useEffect, useState } from 'react';

import { enqueueSnackbar } from 'notistack';
import { Alert, Button, Form } from 'react-bootstrap';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import Spinner from '../components/Spinner';
import { AuthContext } from '../utils/AuthProvider';

const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Nome de usuário deve ter pelo menos 3 caracteres')
    .max(50, 'Nome de usuário deve ter no máximo 50 caracteres')
    .trim(),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
  rememberMe: z.boolean().optional(),
});

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;
const REMEMBER_USER_KEY =
  import.meta.env.VITE_REMEMBER_USER_KEY || 'rememberUser';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    login,
    isLoading: authLoading,
    error: authError,
    clearError,
  } = useContext(AuthContext);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = useCallback(
    async (data) => {
      setLoading(true);
      setServerError('');
      clearError?.();
      clearErrors();

      try {
        const response = await axios.post(
          `${API_BASE_URL}/users`,
          {
            username: data.username,
            password: data.password,
          },
          {
            timeout: parseInt(API_TIMEOUT),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const { token } = response.data;

        if (!token) {
          throw new Error('Token não recebido do servidor');
        }

        // Implementar "lembrar senha" se necessário
        if (data.rememberMe) {
          localStorage.setItem(REMEMBER_USER_KEY, data.username);
        } else {
          localStorage.removeItem(REMEMBER_USER_KEY);
        }

        login(token);

        enqueueSnackbar({
          variant: 'success',
          message: 'Login realizado com sucesso!',
          preventDuplicate: true,
        });
      } catch (error) {
        console.error('Erro no login:', error);

        let errorMessage = 'Erro interno do servidor';

        if (error.response) {
          // Erro da API
          const status = error.response.status;
          const data = error.response.data;

          switch (status) {
            case 400:
              errorMessage = data.message || 'Dados inválidos';
              break;
            case 401:
              errorMessage = 'Credenciais inválidas';
              setError('username', { message: 'Usuário ou senha incorretos' });
              setError('password', { message: 'Usuário ou senha incorretos' });
              break;
            case 404:
              errorMessage = 'Usuário não encontrado';
              setError('username', { message: 'Usuário não encontrado' });
              break;
            case 429:
              errorMessage =
                'Muitas tentativas. Tente novamente em alguns minutos';
              break;
            case 500:
              errorMessage = 'Erro interno do servidor';
              break;
            default:
              errorMessage = data.message || 'Erro desconhecido';
          }
        } else if (error.request) {
          // Erro de rede
          errorMessage = 'Erro de conexão. Verifique sua internet';
        } else if (error.code === 'ECONNABORTED') {
          // Timeout
          errorMessage = 'Tempo limite esgotado. Tente novamente';
        }

        setServerError(errorMessage);

        enqueueSnackbar({
          variant: 'error',
          message: errorMessage,
          preventDuplicate: true,
        });
      } finally {
        setLoading(false);
      }
    },
    [login, clearError, clearErrors, setError]
  );

  // Carregar usuário lembrado
  useEffect(() => {
    const rememberedUser = localStorage.getItem(REMEMBER_USER_KEY);
    if (rememberedUser) {
      // Você pode setar o valor do campo username aqui se desejar
    }
  }, []);

  const isFormDisabled = loading || isSubmitting || authLoading;

  return (
    <div className="xl:flex justify-center items-center mx-auto mt-24 px-4 lg:w-1/2 lg:shadow-2xl rounded-xl lg:py-20">
      <div className="lg:m-auto m-4">
        <img
          src="/service-photo.jpg"
          alt="Ilustração do serviço de gerenciamento de livros"
          className="md:w-[400px] w-[250px] m-auto lg:rounded-e-3xl"
        />
      </div>

      <Form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col m-auto w-3/4 sm:w-2/4 lg:2/3 xl:w-1/2"
        noValidate
      >
        <h1 className="text-2xl m-auto mb-4 text-gray-800 font-semibold">
          Fazer Login
        </h1>

        {(serverError || authError) && (
          <Alert variant="danger" className="mb-3">
            {serverError || authError}
          </Alert>
        )}

        <Form.Group controlId="username" className="my-2">
          <Form.Label className="font-medium">Nome de usuário *</Form.Label>
          <Form.Control
            type="text"
            {...register('username')}
            isInvalid={!!errors.username}
            disabled={isFormDisabled}
            placeholder="Digite seu nome de usuário"
            autoComplete="username"
            aria-describedby="username-error"
          />
          <Form.Control.Feedback type="invalid" id="username-error">
            {errors.username?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="password" className="my-2">
          <Form.Label className="font-medium">Senha *</Form.Label>
          <Form.Control
            type="password"
            {...register('password')}
            isInvalid={!!errors.password}
            disabled={isFormDisabled}
            placeholder="Digite sua senha"
            autoComplete="current-password"
            aria-describedby="password-error"
          />
          <Form.Control.Feedback type="invalid" id="password-error">
            {errors.password?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="my-3">
          <Form.Check
            type="checkbox"
            id="rememberMe"
            label="Lembrar meu usuário"
            {...register('rememberMe')}
            disabled={isFormDisabled}
            className="text-sm text-gray-600"
          />
        </Form.Group>

        <Button
          variant="dark"
          type="submit"
          className="bg-gray-800 hover:bg-gray-900 transition-colors duration-200 py-2 font-medium"
          disabled={isFormDisabled}
          aria-describedby="login-button-status"
        >
          {isFormDisabled ? (
            <>
              <Spinner size="sm" className="me-2" />
              Entrando...
            </>
          ) : (
            'Fazer Login'
          )}
        </Button>

        <div className="text-center mt-4">
          <small className="text-gray-500">* Campos obrigatórios</small>
        </div>

        {loading && (
          <div className="text-center mt-3" id="login-button-status">
            <Spinner />
            <p className="text-sm text-gray-600 mt-2">
              Validando credenciais...
            </p>
          </div>
        )}
      </Form>
    </div>
  );
};

export default Login;
