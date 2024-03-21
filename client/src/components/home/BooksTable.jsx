import { Link } from 'react-router-dom';
import { CiCircleInfo, CiEdit, CiCircleRemove } from "react-icons/ci";

const BooksTable = ({ books }) => {
  return (
    <table className='w-full border-separate border-spacing-2'>
      <thead>
        <tr>
          <th className='border border-slate-600 rounded-xl bg-slate-200'>ID</th>
          <th className='border border-slate-600 rounded-xl bg-slate-200'>Título</th>
          <th className='border border-slate-600 rounded-xl bg-slate-200 max-md:hidden'>
            Autor
          </th>
          <th className='border border-slate-600 rounded-xl bg-slate-200 max-md:hidden'>
            Ano de Publicação
          </th>
          <th className='border border-slate-600 rounded-xl bg-slate-200'>Operações</th>
        </tr>
      </thead>
      <tbody>
        {books.map((book, index) => (
          <tr key={book._id} className='h-8'>
            <td className='border border-slate-700 rounded-xl text-center'>
              {index + 1}
            </td>
            <td className='border border-slate-700 rounded-xl text-center'>
              {book.title}
            </td>
            <td className='border border-slate-700 rounded-xl text-center max-md:hidden'>
              {book.author}
            </td>
            <td className='border border-slate-700 rounded-xl text-center max-md:hidden'>
              {book.publishYear}
            </td>
            <td className='border border-slate-700 rounded-xl text-center'>
              <div className='flex justify-center gap-x-2'>
                <Link to={`/books/details/${book._id}`}>
                  <CiCircleInfo className='text-2xl' />
                </Link>
                <Link to={`/books/edit/${book._id}`}>
                  <CiEdit className='text-2xl' />
                </Link>
                <Link to={`/books/delete/${book._id}`}>
                  <CiCircleRemove className='text-2xl' />
                </Link>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default BooksTable;