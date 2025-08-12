import axios from 'axios';
import { useCallback, useState } from 'react';

import Cookies from 'js-cookie';
import { enqueueSnackbar } from 'notistack';
import { Link } from 'react-router-dom';

import { Badge, Button, Card, Form, Spinner } from 'react-bootstrap';

import {
  AiFillCheckCircle,
  AiOutlineDelete,
  AiOutlineEdit,
  AiOutlineInfoCircle,
} from 'react-icons/ai';
import { IoLibrary } from 'react-icons/io5';

const BookSingleCard = ({
  book,
  updateBooks,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTimer, setDeleteTimer] = useState(null);
  const [imageError, setImageError] = useState(false);

  const formatPrice = useCallback((price) => {
    if (typeof price === 'number') {
      return price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
    }
    return price ? `R$ ${price}` : 'N/A';
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
      text: status || 'N/A',
    };
    return (
      <Badge bg={config.variant} className="me-1">
        {config.text}
      </Badge>
    );
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleSingleDelete = useCallback(
    async (bookId) => {
      if (deleteTimer) {
        clearTimeout(deleteTimer);
        setDeleteTimer(null);
      }

      if (deleteConfirmId === bookId) {
        setIsDeleting(true);

        try {
          await axios.delete(`http://localhost:5000/books/${bookId}`, {
            headers: {
              Authorization: `Bearer ${Cookies.get('authToken')}`,
            },
          });

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
          enqueueSnackbar({
            variant: 'error',
            message: 'Erro ao deletar livro',
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
    [deleteConfirmId, deleteTimer, updateBooks]
  );

  const handleCardClick = useCallback(
    (e) => {
      e.preventDefault();
      if (isSelectionMode && onSelect) {
        onSelect(book._id);
      }
    },
    [isSelectionMode, onSelect, book._id]
  );

  return (
    <Card
      className={`h-100 shadow-sm transition-all ${
        isSelectionMode ? 'border-primary' : 'border-light'
      } ${isSelected ? 'bg-light border-primary' : ''}`}
      style={{
        cursor: isSelectionMode ? 'pointer' : 'default',
        transform: isSelectionMode && isSelected ? 'scale(0.98)' : 'scale(1)',
      }}
      onClick={handleCardClick}
    >
      {/* Checkbox de seleção */}
      {isSelectionMode && (
        <div
          className="position-absolute top-0 start-0 p-2"
          style={{ zIndex: 10 }}
        >
          <Form.Check
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect && onSelect(book._id)}
            className="bg-white rounded"
          />
        </div>
      )}

      {/* Imagem da capa - centralizada */}
      <div className="text-center p-3" style={{ backgroundColor: '#f8f9fa' }}>
        {book.coverUrl && !imageError ? (
          <img
            src={book.coverUrl}
            alt={`Capa do livro ${book.title}`}
            className="img-fluid rounded shadow-sm mx-auto d-block"
            style={{
              height: '200px',
              width: '140px',
              objectFit: 'cover',
            }}
            onError={handleImageError}
          />
        ) : (
          <div
            className="d-flex align-items-center justify-content-center bg-white border rounded mx-auto"
            style={{ height: '200px', width: '140px' }}
          >
            <IoLibrary size={48} className="text-muted" />
          </div>
        )}

        {/* Badge de preço - posicionado abaixo da imagem */}
        <div className="mt-2">
          <Badge bg="primary" className="fs-6 px-3 py-2">
            {formatPrice(book.price)}
          </Badge>
        </div>
      </div>

      <Card.Body className="p-3 d-flex flex-column">
        {/* Título e Autor */}
        <Card.Title
          className="fs-6 mb-2 text-center fw-bold"
          title={book.title}
        >
          <div className="text-truncate">{book.title}</div>
        </Card.Title>

        <Card.Subtitle
          className="mb-3 text-muted small text-center"
          title={book.author}
        >
          <div className="text-truncate">{book.author}</div>
        </Card.Subtitle>

        {/* Status e Condição - centralizados */}
        <div className="mb-3 text-center">
          {getStatusBadge(book.status)}
          {book.condition && (
            <Badge bg="secondary" className="small ms-1">
              {book.condition}
            </Badge>
          )}
        </div>

        {/* Descrição (se houver) */}
        {book.description && (
          <Card.Text
            className="small text-muted text-center flex-grow-1"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {book.description}
          </Card.Text>
        )}

        {/* Spacer para empurrar ações para baixo */}
        <div className="flex-grow-1"></div>

        {/* Ações - só aparecem se não estiver no modo de seleção */}
        {!isSelectionMode && (
          <div className="d-flex justify-content-center gap-1 mt-3">
            <Link
              to={`/books/details/${book._id}`}
              className="btn btn-outline-info btn-sm"
              title="Ver detalhes"
            >
              <AiOutlineInfoCircle size={14} />
            </Link>

            <Link
              to={`/books/edit/${book._id}`}
              className="btn btn-outline-warning btn-sm"
              title="Editar livro"
            >
              <AiOutlineEdit size={14} />
            </Link>

            <Button
              variant={
                deleteConfirmId === book._id ? 'success' : 'outline-danger'
              }
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleSingleDelete(book._id);
              }}
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
                <AiFillCheckCircle size={14} />
              ) : (
                <AiOutlineDelete size={14} />
              )}
            </Button>
          </div>
        )}

        {/* ID do livro (pequeno e discreto) */}
        <div className="text-center mt-2">
          <small
            className="text-muted font-monospace"
            style={{ fontSize: '0.7rem' }}
          >
            {book._id?.slice(-8)}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default BookSingleCard;
