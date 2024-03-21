import { useState } from 'react';
import { BiShow } from 'react-icons/bi';
import { FaBook, FaUserCircle } from "react-icons/fa";
import { CiCircleInfo, CiCircleRemove, CiEdit } from "react-icons/ci";
import { Link } from 'react-router-dom';

import BookModal from './BookModal';

const BookSingleCard = ({ book }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className='border-2 border-gray-500 rounded-lg px-4 py-4 m-4 relative hover:shadow-xl'>
      <h2 className='absolute top-2 right-2 px-4 py-1 bg-slate-200 rounded-lg'>
        {book.publishYear}
      </h2>
      <h4 className='my-2 text-gray-600'>{book._id}</h4>
      <div className='flex justify-start items-center gap-x-2'>
        <FaBook size={20} />
        <h2 className='my-1'>{book.title}</h2>
      </div>
      <div className='flex justify-start items-center gap-x-2'>
        <FaUserCircle size={20} /> 
        <h2 className='my-1'>{book.author}</h2>
      </div>
      <div className='flex items-center justify-center gap-x-10 mt-4 p-2'>
        <BiShow size={30} className='cursor-pointer' onClick={() => setShowModal(true)} />
        <Link to={`/books/details/${book._id}`}>
          <CiCircleInfo size={30} />
        </Link>
        <Link to={`/books/edit/${book._id}`}>
          <CiEdit size={30} />
        </Link>
        <Link to={`/books/delete/${book._id}`}>
          <CiCircleRemove size={30} />
        </Link>
      </div>
      {showModal && (
        <BookModal book={book} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default BookSingleCard;