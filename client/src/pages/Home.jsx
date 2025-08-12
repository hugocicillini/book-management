import axios from 'axios';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import Cookies from 'js-cookie';
import { enqueueSnackbar } from 'notistack';

import { AiOutlineLogout, AiOutlineReload } from 'react-icons/ai';
import { CiSearch, CiTrash, CiViewList, CiViewTable } from 'react-icons/ci';

import {
  Alert,
  Button,
  Form,
  InputGroup,
  Pagination,
  Spinner,
} from 'react-bootstrap';

import BooksCard from '../components/home/BooksCard';
import BooksTable from '../components/home/BooksTable';
import { AuthContext } from '../utils/AuthProvider';

// Configuração da API
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;
const SEARCH_DEBOUNCE_DELAY = 300;

// Hook para gerenciar dados dos livros
const useBookData = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBooks: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: parseInt(localStorage.getItem('booksPerPage')) || 10, // Carregar do localStorage
  });

  const fetchBooks = useCallback(
    async (page = 1, showLoading = true) => {
      if (showLoading) setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_BASE_URL}/users`, {
          timeout: parseInt(API_TIMEOUT),
          headers: {
            Authorization: `Bearer ${Cookies.get('authToken')}`,
            'Content-Type': 'application/json',
          },
          params: {
            page,
            limit: pagination.limit,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
        });

        const { books: booksData, pagination: paginationData } = response.data;

        setBooks(Array.isArray(booksData) ? booksData : []);
        setPagination(
          paginationData || {
            currentPage: 1,
            totalPages: 1,
            totalBooks: 0,
            hasNextPage: false,
            hasPrevPage: false,
            limit: pagination.limit,
          }
        );
        setLastFetch(new Date());

        if (booksData.length === 0 && page === 1) {
          enqueueSnackbar({
            variant: 'info',
            message: 'Nenhum livro encontrado na sua coleção.',
            preventDuplicate: true,
          });
        }
      } catch (error) {
        console.error('Erro ao buscar livros:', error);
        setError(error);

        let errorMessage = 'Erro ao carregar livros';

        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;

          switch (status) {
            case 401:
              errorMessage = 'Sessão expirada. Faça login novamente.';
              break;
            case 403:
              errorMessage = 'Acesso negado.';
              break;
            case 404:
              errorMessage = 'Usuário não encontrado.';
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

        enqueueSnackbar({
          variant: 'error',
          message: errorMessage,
          preventDuplicate: true,
        });
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [pagination.limit]
  );

  const updateBooks = useCallback((updatedBooks) => {
    if (typeof updatedBooks === 'function') {
      setBooks(updatedBooks);
    } else if (Array.isArray(updatedBooks)) {
      setBooks(updatedBooks);
    }
  }, []);

  const refreshBooks = useCallback(() => {
    fetchBooks(pagination.currentPage, true);
  }, [fetchBooks, pagination.currentPage]);

  const goToPage = useCallback(
    (page) => {
      fetchBooks(page, true);
    },
    [fetchBooks]
  );

  const changePageSize = useCallback(
    (newLimit) => {
      // Salvar no localStorage
      localStorage.setItem('booksPerPage', newLimit.toString());

      setPagination((prev) => ({ ...prev, limit: newLimit }));
      fetchBooks(1, true);
    },
    [fetchBooks]
  );

  return {
    books,
    loading,
    error,
    lastFetch,
    pagination,
    fetchBooks,
    updateBooks,
    refreshBooks,
    goToPage,
    changePageSize,
  };
};

// Hook para gerenciar preferências do usuário
const useUserPreferences = () => {
  const [showType, setShowType] = useState('table');
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState(''); // Nova state para pesquisa ativa
  const [isSearching, setIsSearching] = useState(false);

  // Carregar preferências salvas
  useEffect(() => {
    const savedShowType = localStorage.getItem(
      import.meta.env.VITE_STORAGE_SHOW_TYPE_KEY || 'showType'
    );
    const savedSearch = sessionStorage.getItem(
      import.meta.env.VITE_STORAGE_SEARCH_KEY || 'search'
    );

    if (savedShowType && ['table', 'card'].includes(savedShowType)) {
      setShowType(savedShowType);
    }

    if (savedSearch) {
      setSearch(savedSearch);
      setActiveSearch(savedSearch);
    }
  }, []);

  // Salvar tipo de visualização
  useEffect(() => {
    localStorage.setItem(
      import.meta.env.VITE_STORAGE_SHOW_TYPE_KEY || 'showType',
      showType
    );
  }, [showType]);

  const handleSearch = useCallback(async () => {
    if (!search.trim()) {
      setActiveSearch('');
      sessionStorage.removeItem(
        import.meta.env.VITE_STORAGE_SEARCH_KEY || 'search'
      );
      return;
    }

    setIsSearching(true);
    setActiveSearch(search.trim());
    sessionStorage.setItem(
      import.meta.env.VITE_STORAGE_SEARCH_KEY || 'search',
      search.trim()
    );
    setIsSearching(false);
  }, [search]);

  const clearSearch = useCallback(() => {
    setSearch('');
    setActiveSearch('');
    sessionStorage.removeItem(
      import.meta.env.VITE_STORAGE_SEARCH_KEY || 'search'
    );
  }, []);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  return {
    showType,
    setShowType,
    search,
    setSearch,
    activeSearch,
    isSearching,
    handleSearch,
    clearSearch,
    handleKeyPress,
  };
};

const Home = () => {
  const { logout } = useContext(AuthContext);
  const {
    books,
    loading,
    error,
    lastFetch,
    pagination,
    fetchBooks,
    updateBooks,
    refreshBooks,
    goToPage,
    changePageSize,
  } = useBookData();
  const {
    showType,
    setShowType,
    search,
    setSearch,
    activeSearch,
    isSearching,
    handleSearch,
    clearSearch,
    handleKeyPress,
  } = useUserPreferences();

  // Carregar dados iniciais
  useEffect(() => {
    fetchBooks(1);
  }, [fetchBooks]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      enqueueSnackbar({
        variant: 'success',
        message: 'Logout realizado com sucesso!',
        preventDuplicate: true,
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }, [logout]);

  const ViewTypeToggle = useMemo(
    () => (
      <div className="d-flex justify-content-center align-items-center gap-3 my-4">
        <Button
          variant={showType === 'table' ? 'primary' : 'outline-secondary'}
          className="d-flex align-items-center gap-2 rounded-pill"
          onClick={() => setShowType('table')}
          aria-label="Visualização em tabela"
        >
          <CiViewTable size={20} />
          Tabela
        </Button>

        <Button
          variant={showType === 'card' ? 'primary' : 'outline-secondary'}
          className="d-flex align-items-center gap-2 rounded-pill"
          onClick={() => setShowType('card')}
          aria-label="Visualização em cartões"
        >
          <CiViewList size={20} />
          Cartões
        </Button>
      </div>
    ),
    [showType, setShowType]
  );

  const SearchBar = useMemo(
    () => (
      <div className="row justify-content-center mb-4">
        <div className="col-12 col-md-8 col-lg-6">
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <InputGroup>
              <InputGroup.Text>
                <CiSearch size={20} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite para pesquisar por título, autor, descrição ou preço..."
                aria-label="Pesquisar livros"
                disabled={isSearching}
              />
              <Button
                variant="primary"
                onClick={handleSearch}
                disabled={isSearching || !search.trim()}
                aria-label="Executar pesquisa"
              >
                {isSearching ? <Spinner size="sm" /> : 'Pesquisar'}
              </Button>
              {(search || activeSearch) && (
                <Button
                  variant="outline-secondary"
                  onClick={clearSearch}
                  aria-label="Limpar pesquisa"
                  disabled={isSearching}
                >
                  <CiTrash size={16} />
                </Button>
              )}
            </InputGroup>
          </Form>
        </div>
      </div>
    ),
    [
      search,
      setSearch,
      handleSearch,
      handleKeyPress,
      clearSearch,
      isSearching,
      activeSearch,
    ]
  );

  const PaginationComponent = useMemo(() => {
    const items = [];
    const { currentPage, totalPages } = pagination;

    // Primeira página
    if (currentPage > 2) {
      items.push(
        <Pagination.Item key={1} onClick={() => goToPage(1)}>
          1
        </Pagination.Item>
      );

      if (currentPage > 3) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }
    }

    // Páginas anteriores, atual e próximas
    for (
      let i = Math.max(1, currentPage - 1);
      i <= Math.min(totalPages, currentPage + 1);
      i++
    ) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => goToPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Última página
    if (currentPage < totalPages - 1) {
      if (currentPage < totalPages - 2) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
      }

      items.push(
        <Pagination.Item key={totalPages} onClick={() => goToPage(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    return (
      <div className="position-relative mt-4">
        {/* Controles de paginação centralizados */}
        <div className="d-flex justify-content-center">
          {pagination.totalPages > 1 && (
            <Pagination className="mb-0">
              <Pagination.First
                onClick={() => goToPage(1)}
                disabled={!pagination.hasPrevPage}
              />
              <Pagination.Prev
                onClick={() => goToPage(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              />

              {items}

              <Pagination.Next
                onClick={() => goToPage(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              />
              <Pagination.Last
                onClick={() => goToPage(pagination.totalPages)}
                disabled={!pagination.hasNextPage}
              />
            </Pagination>
          )}
        </div>

        {/* Controles à direita - posicionamento absoluto */}
        <div className="position-absolute top-0 end-0 d-flex align-items-center">
          <div className="d-flex flex-column align-items-end gap-2">
            {/* Seletor de quantidade com estilo aprimorado */}
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted text-nowrap">
                Exibindo <strong>{books.length}</strong> de{' '}
                <strong>{pagination.totalBooks}</strong> livros
              </small>
              <Form.Select
                size="sm"
                value={pagination.limit}
                onChange={(e) => changePageSize(parseInt(e.target.value))}
                className="border-0 bg-light text-center fw-bold"
                style={{
                  width: '80px',
                  fontSize: '0.8rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  borderRadius: '6px',
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={100}>100</option>
              </Form.Select>
            </div>
          </div>
        </div>
      </div>
    );
  }, [pagination, books.length, goToPage, changePageSize]);

  const HeaderControls = useMemo(
    () => (
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <h2 className="mb-0 text-primary">Minha Biblioteca</h2>
          {lastFetch && (
            <small className="text-muted">
              Última atualização: {lastFetch.toLocaleTimeString()}
            </small>
          )}
        </div>

        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            onClick={refreshBooks}
            disabled={loading}
            className="d-flex align-items-center gap-2"
            aria-label="Atualizar lista de livros"
          >
            {loading ? <Spinner size="sm" /> : <AiOutlineReload size={16} />}
            Atualizar
          </Button>

          <Button
            variant="danger"
            onClick={handleLogout}
            className="d-flex align-items-center gap-2"
            aria-label="Fazer logout"
          >
            <AiOutlineLogout size={16} />
            Sair
          </Button>
        </div>
      </div>
    ),
    [lastFetch, refreshBooks, loading, handleLogout]
  );

  if (error && books.length === 0) {
    return (
      <div className="container mt-5">
        <Alert variant="danger" className="text-center">
          <h4>Erro ao carregar dados</h4>
          <p>Não foi possível carregar seus livros.</p>
          <Button variant="outline-danger" onClick={refreshBooks}>
            Tentar Novamente
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {HeaderControls}

      {SearchBar}

      {ViewTypeToggle}

      {activeSearch && (
        <Alert variant="info" className="text-center">
          {isSearching ? (
            <div className="d-flex align-items-center justify-content-center gap-2">
              <Spinner size="sm" />
              Pesquisando...
            </div>
          ) : (
            <>
              Pesquisando por: "<strong>{activeSearch}</strong>"
              <Button
                variant="link"
                size="sm"
                onClick={clearSearch}
                className="ms-2 p-0"
              >
                Limpar
              </Button>
            </>
          )}
        </Alert>
      )}

      {loading && books.length === 0 ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="text-center">
            <Spinner className="mb-3" />
            <p className="text-muted">Carregando seus livros...</p>
          </div>
        </div>
      ) : showType === 'table' ? (
        <>
          <BooksTable
            books={books}
            search={activeSearch}
            updateBooks={updateBooks}
          />
          {PaginationComponent}
        </>
      ) : (
        <>
          <BooksCard
            books={books}
            search={activeSearch}
            updateBooks={updateBooks}
          />
          {PaginationComponent}
        </>
      )}
    </div>
  );
};

export default Home;
