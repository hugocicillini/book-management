import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import { enqueueSnackbar } from 'notistack';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner,
} from 'react-bootstrap';

import { AiOutlineEdit } from 'react-icons/ai';
import { IoLibrary } from 'react-icons/io5';

import BackButton from '../components/BackButton';

// Configuração da API
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

const ShowBook = () => {
  const [book, setBook] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  // Configuração do axios
  const axiosConfig = {
    timeout: parseInt(API_TIMEOUT),
    headers: {
      Authorization: `Bearer ${Cookies.get('authToken')}`,
      'Content-Type': 'application/json',
    },
  };

  const fetchBook = useCallback(async () => {
    if (!id) {
      setError('ID do livro não fornecido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/books/${id}`,
        axiosConfig
      );
      const bookData = response.data.book || response.data;
      setBook(bookData);
    } catch (error) {
      console.error('Erro ao buscar detalhes do livro:', error);

      let errorMessage = 'Erro ao carregar detalhes do livro';

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 401:
            errorMessage = 'Sessão expirada. Faça login novamente.';
            break;
          case 403:
            errorMessage = 'Você não tem permissão para ver este livro.';
            break;
          case 404:
            errorMessage = 'Livro não encontrado.';
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
  }, [id]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  const formatDateTime = useCallback((dateTime) => {
    if (!dateTime) return 'Não informado';
    return new Date(dateTime).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return 'Não informado';
    return new Date(date).toLocaleDateString('pt-BR');
  }, []);

  const formatPrice = useCallback((price) => {
    if (typeof price === 'number') {
      return price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
    }
    return price ? `R$ ${price}` : 'Não informado';
  }, []);

  const getStatusBadge = useCallback((status) => {
    const statusConfig = {
      disponivel: { variant: 'success', text: 'Disponível' },
      alugado: { variant: 'warning', text: 'Alugado' },
      indisponivel: { variant: 'secondary', text: 'Indisponível' },
      vendido: { variant: 'danger', text: 'Vendido' },
    };

    const config = statusConfig[status] || {
      variant: 'secondary',
      text: status || 'Não informado',
    };
    return (
      <Badge style={{ padding: '0.5rem 1rem' }} bg={config.variant}>
        {config.text}
      </Badge>
    );
  }, []);

  const getConditionBadge = useCallback((condition) => {
    const conditionConfig = {
      Novo: { variant: 'primary', text: 'Novo' },
      Seminovo: { variant: 'info', text: 'Seminovo' },
      Usado: { variant: 'warning', text: 'Usado' },
    };

    const config = conditionConfig[condition] || {
      variant: 'secondary',
      text: condition || 'Não informado',
    };
    return (
      <Badge style={{ padding: '0.5rem 1rem' }} bg={config.variant}>
        {config.text}
      </Badge>
    );
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Reset image error when book changes
  useEffect(() => {
    setImageError(false);
  }, [book.coverUrl]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <Spinner className="mb-3" />
          <p className="text-muted">Carregando detalhes do livro...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="danger" className="text-center">
              <h4>Erro ao carregar livro</h4>
              <p>{error}</p>
              <div className="d-flex gap-2 justify-content-center">
                <Button variant="outline-danger" onClick={fetchBook}>
                  Tentar Novamente
                </Button>
                <Button variant="secondary" onClick={() => navigate('/')}>
                  Voltar ao Início
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={10} md={12}>
          <Card className="shadow">
            <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <BackButton variant="light" />
                <h3 className="mb-0">Detalhes do Livro</h3>
              </div>
            </Card.Header>

            <Card.Body className="p-4">
              <Row>
                {/* Capa do Livro */}
                <Col md={4} className="text-center mb-4">
                  <div className="mb-3 d-flex justify-content-center">
                    {book.coverUrl && !imageError ? (
                      <img
                        src={book.coverUrl}
                        alt={`Capa do livro ${book.title}`}
                        className="img-fluid rounded shadow"
                        style={{
                          maxHeight: '400px',
                          objectFit: 'cover',
                          width: 'auto',
                          maxWidth: '100%',
                        }}
                        onError={handleImageError}
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center bg-light rounded shadow mx-auto"
                        style={{
                          height: '300px',
                          width: '200px',
                          minWidth: '200px',
                        }}
                      >
                        <div className="text-center text-muted">
                          <IoLibrary size={48} />
                          <p className="mt-2 mb-0">
                            {book.coverUrl && imageError
                              ? 'Erro ao carregar imagem'
                              : 'Sem capa'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className="d-flex flex-column gap-2"
                    style={{ maxWidth: '50%', margin: '0 auto' }}
                  >
                    {getStatusBadge(book.status)}
                    {getConditionBadge(book.condition)}
                  </div>
                </Col>

                {/* Informações Principais */}
                <Col md={8}>
                  <Row>
                    <Col>
                      <h2 className="text-primary mb-1">
                        {book.title || 'Título não informado'}
                      </h2>
                      <h5 className="text-muted mb-3">
                        por {book.author || 'Autor não informado'}
                      </h5>

                      {book.description && (
                        <div className="mb-4">
                          <h6 className="text-secondary">Descrição</h6>
                          <p className="text-justify">{book.description}</p>
                        </div>
                      )}

                      <div className="mb-3">
                        <span className="h4 text-success fw-bold">
                          {formatPrice(book.price)}
                        </span>
                      </div>
                    </Col>
                  </Row>

                  {/* Detalhes do Livro */}
                  <Row>
                    <Col md={6}>
                      <h6 className="text-secondary mb-3">
                        Informações do Livro
                      </h6>

                      <div className="mb-2">
                        <strong>ISBN:</strong> {book.isbn || 'Não informado'}
                      </div>

                      <div className="mb-2">
                        <strong>Gênero:</strong> {book.genre || 'Não informado'}
                      </div>

                      <div className="mb-2">
                        <strong>Editora:</strong>{' '}
                        {book.publisher || 'Não informado'}
                      </div>

                      <div className="mb-2">
                        <strong>Data de Publicação:</strong>{' '}
                        {formatDate(book.publishedDate)}
                      </div>

                      <div className="mb-2">
                        <strong>Páginas:</strong>{' '}
                        {book.pages || 'Não informado'}
                      </div>

                      <div className="mb-2">
                        <strong>Idioma:</strong>{' '}
                        {book.language || 'Não informado'}
                      </div>
                    </Col>

                    <Col md={6}>
                      <h6 className="text-secondary mb-3">
                        Informações do Sistema
                      </h6>

                      <div className="mb-2">
                        <strong>ID:</strong>
                        <code className="ms-2 small">{book._id}</code>
                      </div>

                      <div className="mb-2">
                        <strong>Criado em:</strong>{' '}
                        {formatDateTime(book.createdAt)}
                      </div>

                      <div className="mb-2">
                        <strong>Atualizado em:</strong>{' '}
                        {formatDateTime(book.updatedAt)}
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>

              {/* Ações */}
              <Row className="mt-4">
                <Col className="text-end">
                  <div className="d-flex gap-2 justify-content-end">
                    <Button variant="secondary" onClick={() => navigate('/')}>
                      Voltar à Lista
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/books/edit/${id}`)}
                      className="d-flex align-items-center gap-2"
                    >
                      <AiOutlineEdit size={16} />
                      Editar Livro
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ShowBook;
