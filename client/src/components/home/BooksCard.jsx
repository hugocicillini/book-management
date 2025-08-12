import axios from 'axios';
import Cookies from 'js-cookie';
import { useSnackbar } from 'notistack';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Alert,
  Button,
  Col,
  Container,
  Modal,
  Row,
  Spinner,
} from 'react-bootstrap';

import { AiFillDelete, AiOutlineWarning } from 'react-icons/ai';
import { IoAddCircle, IoLibrary } from 'react-icons/io5';

import BookSingleCard from './BookSingleCard';

// Configuração da API
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

// Hook customizado para filtros
const useBookFilter = (books, searchTerm) => {
  return useMemo(() => {
    if (!searchTerm?.trim()) return books;

    const searchLower = searchTerm.toLowerCase().trim();
    return books.filter(
      (book) =>
        book.title?.toLowerCase().includes(searchLower) ||
        book.author?.toLowerCase().includes(searchLower) ||
        book.description?.toLowerCase().includes(searchLower) ||
        book.genre?.toLowerCase().includes(searchLower) ||
        book.publisher?.toLowerCase().includes(searchLower) ||
        book.price?.toString().includes(searchLower)
    );
  }, [books, searchTerm]);
};

// Hook customizado para seleção de livros
const useBookSelection = (filteredBooks) => {
  const [selectedBookIds, setSelectedBookIds] = useState([]);

  const handleSelectBook = useCallback((bookId) => {
    setSelectedBookIds((prev) => {
      return prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedBookIds([]);
  }, []);

  const selectAll = useCallback(() => {
    const allIds = filteredBooks.map((book) => book._id);
    setSelectedBookIds(allIds);
  }, [filteredBooks]);

  const isSelected = useCallback(
    (bookId) => {
      return selectedBookIds.includes(bookId);
    },
    [selectedBookIds]
  );

  return {
    selectedBookIds,
    handleSelectBook,
    clearSelection,
    selectAll,
    isSelected,
  };
};

const BooksCard = ({ books, search, updateBooks }) => {
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Hooks customizados
  const filteredBooks = useBookFilter(books, search);
  const {
    selectedBookIds,
    handleSelectBook,
    clearSelection,
    selectAll,
    isSelected,
  } = useBookSelection(filteredBooks);

  const noRecords = filteredBooks.length === 0;
  const hasSelection = selectedBookIds.length > 0;

  // Configuração do axios
  const axiosConfig = useMemo(
    () => ({
      timeout: parseInt(API_TIMEOUT),
      headers: {
        Authorization: `Bearer ${Cookies.get('authToken')}`,
        'Content-Type': 'application/json',
      },
    }),
    []
  );

  const toggleBulkActions = useCallback(() => {
    setShowBulkActions(!showBulkActions);
    if (showBulkActions) {
      clearSelection();
    }
  }, [showBulkActions, clearSelection]);

  // Função para deletar livros selecionados
  const handleDeleteSelected = useCallback(async () => {
    if (selectedBookIds.length === 0) return;

    setIsDeleting(true);
    try {
      // Deletar cada livro selecionado
      await Promise.all(
        selectedBookIds.map((bookId) =>
          axios.delete(`${API_BASE_URL}/books/${bookId}`, axiosConfig)
        )
      );

      // Atualizar a lista de livros removendo os deletados
      const updatedBooks = books.filter(
        (book) => !selectedBookIds.includes(book._id)
      );
      updateBooks(updatedBooks);

      // Limpar seleção
      clearSelection();
      setShowBulkDeleteModal(false);

      enqueueSnackbar(
        `${selectedBookIds.length} livro(s) deletado(s) com sucesso!`,
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Erro ao deletar livros:', error);
      enqueueSnackbar('Erro ao deletar livros selecionados', {
        variant: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [selectedBookIds, books, updateBooks, clearSelection, axiosConfig]);

  return (
    <Container fluid="md" className="position-relative">
      {/* Header com controles */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-4">
          {hasSelection && (
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                className="d-flex align-items-center gap-2"
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={isDeleting}
              >
                <AiFillDelete size={16} />
                {isDeleting
                  ? 'Deletando...'
                  : `Deletar Selecionados (${selectedBookIds.length})`}
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={clearSelection}
                className="d-flex align-items-center gap-2"
              >
                Limpar Seleção
              </Button>
            </div>
          )}
        </div>

        <div className="d-flex gap-2">
          {/* Ações em massa */}
          {showBulkActions && filteredBooks.length > 0 && (
            <>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={selectAll}
                className="d-flex align-items-center gap-2"
              >
                Selecionar Todos
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={clearSelection}
                className="d-flex align-items-center gap-2"
              >
                Limpar Tudo
              </Button>
              <div className="vr mx-1 opacity-50"></div>
            </>
          )}

          {filteredBooks.length > 0 && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={toggleBulkActions}
              className="d-flex align-items-center gap-2"
            >
              {showBulkActions ? 'Cancelar Seleção' : 'Selecionar Múltiplos'}
            </Button>
          )}

          <Link to="/books/create" className="text-decoration-none">
            <Button
              variant="outline-primary"
              size="sm"
              className="d-flex align-items-center gap-2"
            >
              <IoAddCircle size={20} />
              Criar Livro
            </Button>
          </Link>
        </div>
      </div>

      {/* Informações de busca */}
      {search && (
        <Alert variant="info" className="small mb-4">
          Mostrando {filteredBooks.length} livro(s)
          {search && ` para "${search}"`}
        </Alert>
      )}

      {/* Grid de livros ou estado vazio */}
      {noRecords ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
          <IoLibrary size={64} className="opacity-50 mb-3" />
          <h5>Nenhum livro encontrado</h5>
          {search ? (
            <p>Tente ajustar sua pesquisa por "{search}"</p>
          ) : (
            <div className="text-center">
              <p>Comece adicionando alguns livros à sua coleção</p>
              <Link to="/books/create" className="text-decoration-none">
                <Button
                  variant="primary"
                  className="d-flex align-items-center gap-2 mx-auto"
                >
                  <IoAddCircle size={20} />
                  Criar Primeiro Livro
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            minHeight: '580px',
            maxHeight: '580px',
            overflowY: 'auto',
            overflowX: 'hidden', // Prevenir scroll horizontal
          }}
        >
          <Row className="g-4 pe-2">
            {' '}
            {/* Padding right para evitar sobreposição da scrollbar */}
            {filteredBooks.map((book) => (
              <Col key={book._id} xs={12} sm={6} md={4} lg={3} xl={3}>
                <BookSingleCard
                  book={book}
                  books={books}
                  updateBooks={updateBooks}
                  isSelectionMode={showBulkActions}
                  isSelected={isSelected(book._id)}
                  onSelect={handleSelectBook}
                />
              </Col>
            ))}
          </Row>

          {/* Preenchimento para manter altura consistente */}
          {filteredBooks.length < 12 && (
            <div
              style={{
                height: `${Math.max(0, (12 - filteredBooks.length) * 75)}px`,
              }}
            />
          )}
        </div>
      )}

      {/* Modal de confirmação para deleção em massa */}
      <Modal
        show={showBulkDeleteModal}
        onHide={() => setShowBulkDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <AiOutlineWarning className="text-warning" />
            Confirmar Deleção
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Tem certeza que deseja deletar{' '}
            <strong>{selectedBookIds.length}</strong> livro(s) selecionado(s)?
          </p>
          <Alert variant="warning" className="small">
            Esta ação não pode ser desfeita.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowBulkDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteSelected}
            disabled={isDeleting}
            className="d-flex align-items-center gap-2"
          >
            {isDeleting && <Spinner size="sm" />}
            Deletar Livros
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BooksCard;
