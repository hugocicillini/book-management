import { useState } from 'react';
import { AiFillCheckCircle, AiOutlineDelete, AiOutlineEdit, AiOutlineInfoCircle } from "react-icons/ai";
import { FaBook, FaUserCircle } from "react-icons/fa";
import { Link } from 'react-router-dom';

import BookModal from './BookModal';

const BookSingleCard = ({ book, updateBooks }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [timerId, setTimerId] = useState(null);

  const handleDelete = async (bookId) => {
    if (timerId) {
      clearTimeout(timerId);
    }

    if (selectedBookIds === bookId) {
      try {
        await fetch(`http://localhost:5000/books/${bookId}`, {
          method: 'DELETE',
        });

        updateBooks((prevBooks) => prevBooks.filter((book) => book._id !== bookId));
        setSelectedBookIds(null);

      } catch (error) {
        console.error('Erro ao deletar o livro:', error);
      }
    } else {
      setSelectedBookIds(bookId);
      const newTimerId = setTimeout(() => {
        setSelectedBookIds(null);
      }, 3000);
      setTimerId(newTimerId);
    }
  };

  return (
    <>
      <div className='border-2 border-gray-500 rounded-lg px-4 py-4 ml-4 mr-4 mb-4 relative hover:shadow-xl hover:scale-105 transition duration-100 hover:cursor-pointer' onClick={() => setShowModal(true)}>
        <h2 className='absolute top-2 right-2 px-4 py-1 bg-slate-200 rounded-lg'>{book.publishYear}</h2>

        <h4 className='mt-6 mb-2 text-gray-600'>{book._id}</h4>

        <div className='flex justify-start items-center gap-x-2'>
          <FaBook size={24} />
          <h2 className='my-1'>{book.title}</h2>
        </div>

        <div className='flex justify-start items-center gap-x-2'>
          <FaUserCircle size={24} />
          <h2 className='my-1'>{book.author}</h2>
        </div>

        <div onClick={(e) => e.stopPropagation()} className='flex items-center justify-center gap-6 mt-4 border-2 border-black w-fit m-auto rounded-3xl p-2'>
          <Link to={`/books/details/${book._id}`}>
            <AiOutlineInfoCircle size={24} />
          </Link>

          <Link to={`/books/edit/${book._id}`}>
            <AiOutlineEdit size={24} />
          </Link>

          {
            selectedBookIds === book._id ? (
              <AiFillCheckCircle
                size={24}
                cursor="pointer"
                color='green'
                onClick={() => handleDelete(book._id)}
              />
            ) : (
              <AiOutlineDelete
                size={24}
                cursor="pointer"
                onClick={() => handleDelete(book._id)}
              />
            )
          }
        </div>
      </div>
      {
        showModal && (
          <BookModal book={book} onClose={() => setShowModal(false)} />
        )
      }
    </>
  );
};

export default BookSingleCard;