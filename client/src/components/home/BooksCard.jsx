import React from 'react';
import Container from 'react-bootstrap/Container';
import BookSingleCard from './BookSingleCard';
import { IoLibrary, IoAddCircle } from 'react-icons/io5';
import { Link } from 'react-router-dom';

const BooksCard = ({ books, search, updateBooks }) => {
  const filteredBooks = books.filter((book) => {
    const searchTermLower = search.toLowerCase();
    return (
      searchTermLower === '' ||
      book.title.toLowerCase().includes(searchTermLower) ||
      book.author.toLowerCase().includes(searchTermLower) ||
      book.publishYear.toString().includes(searchTermLower)
    );
  });

  const noRecords = filteredBooks.length === 0;

  return (
    <Container>
      <div className="flex justify-between items-center m-2">
        <IoLibrary size={40} className="m-2" />

        <Link to="/books/create">
          <span className="flex items-center gap-1 bg-slate-300 rounded-md p-1 hover:scale-105 transition-all cursor-pointer">
            <IoAddCircle size={30} />
            <p className="select-none">Criar</p>
          </span>
        </Link>
      </div>
      {
        noRecords ? (
          <div className='flex items-center justify-center mt-10'>Nenhum registro encontrado!</div>
        ) : (
          <div className='grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {
              filteredBooks.map((item) => (
                <BookSingleCard key={item._id} book={item} books={books} updateBooks={updateBooks} />
              ))
            }
          </div>
        )
      }
    </Container>
  );
};

export default BooksCard;