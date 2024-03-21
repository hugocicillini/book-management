import { AiOutlineClose } from 'react-icons/ai';
import { FaBook, FaUserCircle } from 'react-icons/fa';


const BookModal = ({ book, onClose }) => {
  return (
    <div
      className='fixed bg-black bg-opacity-60 top-0 left-0 right-0 bottom-0 z-50 flex justify-center items-center'
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className='w-[600px] max-w-full h-[400px] bg-white rounded-xl p-4 flex flex-col relative'
      >
        <AiOutlineClose size={20} className='absolute right-4 top-4 cursor-pointer' onClick={onClose} />
        <h2 className='w-fit px-4 py-1 bg-slate-200 rounded-lg'>
          {book.publishYear}
        </h2>
        <h4 className='my-2 text-gray-500'>{book._id}</h4>
        <div className='flex justify-start items-center gap-x-2'>
          <FaBook size={20} />
          <h2 className='my-1'>{book.title}</h2>
        </div>
        <div className='flex justify-start items-center gap-x-2'>
          <FaUserCircle size={20} />
          <h2 className='my-1'>{book.author}</h2>
        </div>
        <p className='mt-4'>Sinopse:</p>
        <p className='my-2'>{book.synopsis}</p>
      </div>
    </div>
  );
};

export default BookModal;