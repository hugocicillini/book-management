import axios from 'axios';
import { useCallback, useState } from 'react';

import Cookies from 'js-cookie';
import { enqueueSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
} from 'react-bootstrap';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import BackButton from '../components/BackButton';
import Spinner from '../components/Spinner';

// Configuração da API
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

// Schema de validação aprimorado
const bookSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres')
    .trim(),
  author: z
    .string()
    .min(1, 'Autor é obrigatório')
    .max(100, 'Autor deve ter no máximo 100 caracteres')
    .trim(),
  description: z
    .string()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .optional()
    .or(z.literal('')),
  price: z
    .string()
    .min(1, 'Preço é obrigatório')
    .regex(
      /^\d+([.,]\d{1,2})?$/,
      'Preço deve ser um número válido (ex: 29,99)'
    ),
  isbn: z.string().optional().or(z.literal('')),
  genre: z
    .string()
    .max(50, 'Gênero deve ter no máximo 50 caracteres')
    .optional()
    .or(z.literal('')),
  publisher: z
    .string()
    .max(100, 'Editora deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  publishedDate: z.string().optional().or(z.literal('')),
  pages: z.string().optional().or(z.literal('')),
  language: z
    .string()
    .max(30, 'Idioma deve ter no máximo 30 caracteres')
    .optional()
    .or(z.literal('')),
  condition: z.string().optional(),
  status: z.string().optional(),
  coverUrl: z
    .string()
    .url('URL da capa deve ser válida')
    .optional()
    .or(z.literal('')),
});

const CreateBook = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCustomLanguage, setShowCustomLanguage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: '',
      author: '',
      description: '',
      price: '',
      isbn: '',
      genre: '',
      publisher: '',
      publishedDate: '',
      pages: '',
      language: 'Português',
      condition: 'Novo',
      status: 'disponivel',
      coverUrl: '',
    },
  });

  // Configuração do axios
  const axiosConfig = {
    timeout: parseInt(API_TIMEOUT),
    headers: {
      Authorization: `Bearer ${Cookies.get('authToken')}`,
      'Content-Type': 'application/json',
    },
  };

  const onSubmit = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);

      try {
        // Processar dados antes de enviar
        const processedData = {
          ...data,
          price: parseFloat(data.price.replace(',', '.')), // Converter para número
          pages: data.pages ? parseInt(data.pages) : undefined,
          publishedDate: data.publishedDate || undefined,
          // Remover campos vazios
          isbn: data.isbn || undefined,
          genre: data.genre || undefined,
          publisher: data.publisher || undefined,
          language: data.language || undefined,
          coverUrl: data.coverUrl || undefined,
          description: data.description || undefined,
        };

        await axios.post(`${API_BASE_URL}/books`, processedData, axiosConfig);

        enqueueSnackbar({
          variant: 'success',
          message: 'Livro criado com sucesso!',
          preventDuplicate: true,
        });

        // Limpar formulário
        reset();

        // Navegar para a home
        navigate('/');
      } catch (error) {
        console.error('Erro ao criar livro:', error);

        let errorMessage = 'Erro ao criar livro';

        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;

          switch (status) {
            case 400:
              errorMessage = data.message || 'Dados inválidos';
              break;
            case 401:
              errorMessage = 'Sessão expirada. Faça login novamente.';
              break;
            case 403:
              errorMessage = 'Você não tem permissão para criar livros.';
              break;
            case 409:
              errorMessage = 'Livro com este título já existe.';
              break;
            case 500:
              errorMessage = 'Erro interno do servidor.';
              break;
            default:
              errorMessage = data?.message || 'Erro desconhecido';
          }
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Tempo limite esgotado. Tente novamente.';
        } else if (error.request) {
          errorMessage = 'Erro de conexão. Verifique sua internet.';
        }

        setError(errorMessage);
        enqueueSnackbar({
          variant: 'error',
          message: errorMessage,
          preventDuplicate: true,
        });
      } finally {
        setLoading(false);
      }
    },
    [navigate, reset]
  );

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8} md={10}>
          <Card className="shadow">
            <Card.Header className="bg-success text-white d-flex align-items-center gap-3">
              <BackButton variant="light" />
              <h3 className="mb-0">Criar Novo Livro</h3>
            </Card.Header>

            <Card.Body className="p-4">
              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Row>
                  {/* Informações Básicas */}
                  <Col md={6}>
                    <h5 className="text-success mb-3">Informações Básicas</h5>

                    <Form.Group className="mb-3">
                      <Form.Label>Título *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Digite o título do livro"
                        {...register('title')}
                        isInvalid={!!errors.title}
                        disabled={loading || isSubmitting}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.title?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Autor *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Digite o nome do autor"
                        {...register('author')}
                        isInvalid={!!errors.author}
                        disabled={loading || isSubmitting}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.author?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Descrição</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Digite uma descrição do livro"
                        {...register('description')}
                        isInvalid={!!errors.description}
                        disabled={loading || isSubmitting}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.description?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Preço *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ex: 29,99"
                        {...register('price')}
                        isInvalid={!!errors.price}
                        disabled={loading || isSubmitting}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.price?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Detalhes Adicionais */}
                  <Col md={6}>
                    <h5 className="text-success mb-3">Detalhes</h5>

                    <Form.Group className="mb-3">
                      <Form.Label>ISBN</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="978-3-16-148410-0"
                        {...register('isbn')}
                        isInvalid={!!errors.isbn}
                        disabled={loading || isSubmitting}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Gênero</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ex: Ficção, Romance, Técnico"
                        {...register('genre')}
                        isInvalid={!!errors.genre}
                        disabled={loading || isSubmitting}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Editora</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nome da editora"
                        {...register('publisher')}
                        isInvalid={!!errors.publisher}
                        disabled={loading || isSubmitting}
                      />
                    </Form.Group>

                    <Row>
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Data de Publicação</Form.Label>
                          <Form.Control
                            type="date"
                            {...register('publishedDate')}
                            disabled={loading || isSubmitting}
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Páginas</Form.Label>
                          <Form.Control
                            type="number"
                            placeholder="Número de páginas"
                            {...register('pages')}
                            disabled={loading || isSubmitting}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Idioma</Form.Label>
                      <Form.Select
                        {...register('language')}
                        disabled={loading || isSubmitting}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === 'outros') {
                            setShowCustomLanguage(true);
                          } else {
                            setShowCustomLanguage(false);
                          }
                          // Atualizar o valor do formulário
                          register('language').onChange(e);
                        }}
                      >
                        <option value="Português">Português</option>
                        <option value="Inglês">Inglês</option>
                        <option value="Espanhol">Espanhol</option>
                        <option value="Francês">Francês</option>
                        <option value="Alemão">Alemão</option>
                        <option value="Italiano">Italiano</option>
                        <option value="Japonês">Japonês</option>
                        <option value="Chinês">Chinês</option>
                        <option value="Russo">Russo</option>
                        <option value="Árabe">Árabe</option>
                        <option value="outros">Outros</option>
                      </Form.Select>
                    </Form.Group>
                    
                    {showCustomLanguage && (
                      <Form.Group className="mb-3">
                        <Form.Label>Especificar Idioma</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Digite o idioma"
                          {...register('language')}
                          disabled={loading || isSubmitting}
                        />
                      </Form.Group>
                    )}
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Condição</Form.Label>
                      <Form.Select
                        {...register('condition')}
                        disabled={loading || isSubmitting}
                      >
                        <option value="Novo">Novo</option>
                        <option value="Seminovo">Seminovo</option>
                        <option value="Usado">Usado</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        {...register('status')}
                        disabled={loading || isSubmitting}
                      >
                        <option value="disponivel">Disponível</option>
                        <option value="alugado">Alugado</option>
                        <option value="indisponivel">Indisponível</option>
                        <option value="vendido">Vendido</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>URL da Capa</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://exemplo.com/capa.jpg"
                    {...register('coverUrl')}
                    isInvalid={!!errors.coverUrl}
                    disabled={loading || isSubmitting}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.coverUrl?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-flex gap-3 justify-content-end">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/')}
                    disabled={loading || isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="success"
                    type="submit"
                    disabled={loading || isSubmitting}
                    className="d-flex align-items-center gap-2"
                  >
                    {(loading || isSubmitting) && <Spinner size="sm" />}
                    Criar Livro
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateBook;
