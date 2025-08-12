import { AiOutlineClose } from 'react-icons/ai';
import { FaBook, FaUserCircle } from 'react-icons/fa';

const BookModal = ({ book, onClose }) => {
  return (
    <div
      className="fixed bg-slate-800 bg-opacity-50 top-0 left-0 right-0 bottom-0 z-1 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[600px] bg-white rounded-xl p-8 flex flex-col relative"
      >
        <div className="w-fit px-4 py-1 bg-slate-200 rounded-lg">
          <AiOutlineClose
            size={20}
            className="absolute right-4 top-4 cursor-pointer"
            onClick={onClose}
          />
          <h4>Info</h4>
        </div>

        <h4 className="my-2 text-gray-500">{book._id}</h4>

        <div className="flex justify-start items-center gap-x-2">
          <FaBook size={24} />
          <h2 className="my-1">{book.title}</h2>
        </div>

        <div className="flex justify-start items-center gap-x-2">
          <FaUserCircle size={24} />
          <h2 className="my-1">{book.author}</h2>
        </div>

        <div className="flex flex-col justify-start my-2 gap-y-2">
          <h2 className="my-1">Descrição:</h2>
          <p className="overflow-y-scroll max-h-48 border-2 p-1 rounded-md">
            {book.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookModal;
