import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Cookies from 'js-cookie';
import { enqueueSnackbar } from 'notistack';
import { Link } from 'react-router-dom';

import {
  Alert,
  Button,
  Container,
  Form,
  Modal,
  Spinner,
  Table,
} from 'react-bootstrap';

import {
  AiFillCheckCircle,
  AiFillDelete,
  AiOutlineArrowUp,
  AiOutlineDelete,
  AiOutlineEdit,
  AiOutlineInfoCircle,
  AiOutlineWarning,
} from 'react-icons/ai';
import { IoAddCircle, IoLibrary } from 'react-icons/io5';

// Configuração da API
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

// Hook customizado para filtros
const useBookFilter = (books, searchTerm) => {
  return useMemo(() => {
    if (!searchTerm.trim()) return books;

    const searchLower = searchTerm.toLowerCase().trim();
    return books.filter(
      (book) =>
        book.title?.toLowerCase().includes(searchLower) ||
        book.author?.toLowerCase().includes(searchLower) ||
        book.price?.toString().includes(searchLower)
    );
  }, [books, searchTerm]);
};

// Hook customizado para seleção de livros
const useBookSelection = (filteredBooks) => {
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  const filteredBookIds = useMemo(
    () => filteredBooks.map((book) => book._id),
    [filteredBooks]
  );

  const handleSelectAll = useCallback(() => {
    const newSelectedIds = selectAllChecked ? [] : filteredBookIds;
    setSelectedBookIds(newSelectedIds);
    setSelectAllChecked(!selectAllChecked);
  }, [selectAllChecked, filteredBookIds]);

  const handleSingleSelect = useCallback(
    (bookId) => {
      setSelectedBookIds((prev) => {
        const newSelected = prev.includes(bookId)
          ? prev.filter((id) => id !== bookId)
          : [...prev, bookId];

        setSelectAllChecked(
          newSelected.length === filteredBookIds.length &&
            filteredBookIds.length > 0
        );
        return newSelected;
      });
    },
    [filteredBookIds]
  );

  const clearSelection = useCallback(() => {
    setSelectedBookIds([]);
    setSelectAllChecked(false);
  }, []);

  // Reset seleção quando filtros mudam
  useEffect(() => {
    clearSelection();
  }, [filteredBooks, clearSelection]);

  return {
    selectedBookIds,
    selectAllChecked,
    handleSelectAll,
    handleSingleSelect,
    clearSelection,
  };
};

const BooksTable = ({ books, search, updateBooks }) => {
  // States
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTimer, setDeleteTimer] = useState(null);

  // Hooks customizados
  const filteredBooks = useBookFilter(books, search);
  const {
    selectedBookIds,
    selectAllChecked,
    handleSelectAll,
    handleSingleSelect,
    clearSelection,
  } = useBookSelection(filteredBooks);

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

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (deleteTimer) {
        clearTimeout(deleteTimer);
      }
    };
  }, [deleteTimer]);

  const handleSingleDelete = useCallback(
    async (bookId) => {
      if (deleteTimer) {
        clearTimeout(deleteTimer);
        setDeleteTimer(null);
      }

      if (deleteConfirmId === bookId) {
        setIsDeleting(true);

        try {
          await axios.delete(`${API_BASE_URL}/books/${bookId}`, axiosConfig);

          updateBooks((prevBooks) =>
            prevBooks.filter((book) => book._id !== bookId)
          );
          setDeleteConfirmId(null);

          enqueueSnackbar({
            variant: 'success',
            message: 'Livro deletado com sucesso!',
            preventDuplicate: true,
          });
        } catch (error) {
          console.error('Erro ao deletar livro:', error);

          const errorMessage =
            error.response?.data?.message || 'Erro ao deletar livro';
          enqueueSnackbar({
            variant: 'error',
            message: errorMessage,
            preventDuplicate: true,
          });
        } finally {
          setIsDeleting(false);
        }
      } else {
        setDeleteConfirmId(bookId);
        const timer = setTimeout(() => {
          setDeleteConfirmId(null);
        }, 3000);
        setDeleteTimer(timer);
      }
    },
    [deleteConfirmId, deleteTimer, updateBooks, axiosConfig]
  );

  const handleBulkDelete = useCallback(async () => {
    setIsDeleting(true);

    try {
      const deletePromises = selectedBookIds.map((bookId) =>
        axios.delete(`${API_BASE_URL}/books/${bookId}`, axiosConfig)
      );

      await Promise.all(deletePromises);

      updateBooks((prevBooks) =>
        prevBooks.filter((book) => !selectedBookIds.includes(book._id))
      );

      clearSelection();
      setShowBulkDeleteModal(false);

      enqueueSnackbar({
        variant: 'success',
        message: `${selectedBookIds.length} livro(s) deletado(s) com sucesso!`,
        preventDuplicate: true,
      });
    } catch (error) {
      console.error('Erro ao deletar livros:', error);

      const errorMessage =
        error.response?.data?.message || 'Erro ao deletar livros';
      enqueueSnackbar({
        variant: 'error',
        message: errorMessage,
        preventDuplicate: true,
      });
    } finally {
      setIsDeleting(false);
    }
  }, [selectedBookIds, updateBooks, clearSelection, axiosConfig]);

  const formatPrice = useCallback((price) => {
    if (typeof price === 'number') {
      return price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
    }
    return `R$ ${price}`;
  }, []);

  const noRecords = filteredBooks.length === 0;
  const hasSelection = selectedBookIds.length > 0;

  return (
    <Container fluid="md" className="position-relative">
      {/* Header com controles */}
      <div className="d-flex justify-content-between align-items-center my-3">
        <div className="d-flex align-items-center gap-3">
          {hasSelection && (
            <Button
              variant="danger"
              className="d-flex align-items-center gap-2"
              size='sm'
              onClick={() => setShowBulkDeleteModal(true)}
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner size="sm" /> : <AiFillDelete size={16} />}
              Deletar Selecionados ({selectedBookIds.length})
            </Button>
          )}
        </div>

        <Link to="/books/create" className="text-decoration-none">
          <Button
            variant="outline-primary"
            size="sm"
            className="d-flex align-items-center gap-2"
          >
            <IoAddCircle size={24} />
            Criar Livro
          </Button>
        </Link>
      </div>

      {/* Informações */}
      {search && (
        <Alert variant="info" className="small">
          Mostrando {filteredBooks.length} livro(s)
          {search && ` para "${search}"`}
        </Alert>
      )}

      {/* Tabela */}
      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th className="text-center" style={{ width: '50px' }}>
              <Form.Check
                checked={selectAllChecked}
                onChange={handleSelectAll}
                disabled={noRecords || isDeleting}
                aria-label="Selecionar todos os livros"
              />
            </th>
            <th style={{ width: '60px' }}>N°</th>
            <th>Título</th>
            <th>Autor</th>
            <th style={{ width: '120px' }}>Preço</th>
            <th style={{ width: '150px' }} className="text-center">
              Ações
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredBooks.map((book, index) => (
            <tr
              key={book._id}
              className={
                selectedBookIds.includes(book._id) ? 'table-active' : ''
              }
            >
              <td className="text-center">
                <Form.Check
                  checked={selectedBookIds.includes(book._id)}
                  onChange={() => handleSingleSelect(book._id)}
                  disabled={isDeleting}
                  aria-label={`Selecionar livro ${book.title}`}
                />
              </td>
              <td className="fw-bold text-muted">{index + 1}</td>
              <td className="fw-medium">{book.title}</td>
              <td>{book.author}</td>
              <td className="fw-bold">{formatPrice(book.price)}</td>
              <td>
                <div className="d-flex justify-content-center gap-2">
                  <Link
                    to={`/books/details/${book._id}`}
                    className="btn btn-outline-info btn-sm"
                    title="Ver detalhes"
                  >
                    <AiOutlineInfoCircle size={16} />
                  </Link>

                  <Link
                    to={`/books/edit/${book._id}`}
                    className="btn btn-outline-warning btn-sm"
                    title="Editar livro"
                  >
                    <AiOutlineEdit size={16} />
                  </Link>

                  <Button
                    variant={
                      deleteConfirmId === book._id
                        ? 'success'
                        : 'outline-danger'
                    }
                    size="sm"
                    onClick={() => handleSingleDelete(book._id)}
                    disabled={isDeleting}
                    title={
                      deleteConfirmId === book._id
                        ? 'Clique novamente para confirmar'
                        : 'Deletar livro'
                    }
                  >
                    {isDeleting && deleteConfirmId === book._id ? (
                      <Spinner size="sm" />
                    ) : deleteConfirmId === book._id ? (
                      <AiFillCheckCircle size={16} />
                    ) : (
                      <AiOutlineDelete size={16} />
                    )}
                  </Button>
                </div>
              </td>
            </tr>
          ))}

          {noRecords && (
            <tr>
              <td colSpan="6" className="text-center py-5 text-muted">
                <div className="d-flex flex-column align-items-center gap-3">
                  <IoLibrary size={48} className="opacity-50" />
                  <div>
                    <h5>Nenhum livro encontrado</h5>
                    {search ? (
                      <p>Tente ajustar sua pesquisa por "{search}"</p>
                    ) : (
                      <p>Comece adicionando alguns livros à sua coleção</p>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </Table>

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
            onClick={handleBulkDelete}
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

export default BooksTable;
