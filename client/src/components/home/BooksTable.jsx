import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';

import { AiFillCheckCircle, AiFillDelete, AiOutlineArrowDown, AiOutlineArrowUp, AiOutlineDelete, AiOutlineEdit, AiOutlineInfoCircle } from 'react-icons/ai';

import { IoAddCircle, IoLibrary } from 'react-icons/io5';
import { Link } from 'react-router-dom';

const BooksTable = ({ books, search, updateBooks }) => {
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [timerId, setTimerId] = useState(null);
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [filteredBookIds, setFilteredBookIds] = useState([]);
  const [sortOrder, setSortOrder] = useState({ column: "title", ascending: false });
  const [arrowDirection, setArrowDirection] = useState({ title: 'down', author: 'up', publishYear: 'up' });

  const filterBooks = (books, searchTerm) => {
    const searchTermLower = searchTerm.toLowerCase();
    return books.filter((book) => (
      searchTermLower === '' ||
      book.title.toLowerCase().includes(searchTermLower) ||
      book.author.toLowerCase().includes(searchTermLower) ||
      book.publishYear.toString().includes(searchTermLower)
    ));
  };

  useEffect(() => {
    const filteredBooks = filterBooks(books, search);
    setFilteredBookIds(filteredBooks.map((book) => book._id));
    setSelectedBookIds([]);
    setSelectAllChecked(false);
  }, [books, search]);

  const handleSelectAll = () => {
    const newSelectedBookIds = selectAllChecked ? [] : filteredBookIds;
    setSelectedBookIds(newSelectedBookIds);
    setSelectAllChecked(!selectAllChecked);
  };

  const handleSingleSelect = (bookId) => {
    const newSelectedBookIds = selectedBookIds.includes(bookId)
      ? selectedBookIds.filter((id) => id !== bookId)
      : [...selectedBookIds, bookId];
    setSelectedBookIds(newSelectedBookIds);
    setSelectAllChecked(newSelectedBookIds.length === filteredBookIds.length);
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(selectedBookIds.map(async (bookId) => {
        await fetch(`http://localhost:5000/books/${bookId}`, {
          method: 'DELETE',
        });
      }));

      updateBooks((prevBooks) => prevBooks.filter((book) => !selectedBookIds.includes(book._id)));
      setSelectedBookIds([]);
    } catch (error) {
      console.error('Erro ao deletar os livros:', error);
    }
  };

  const handleDelete = async (bookId) => {
    if (timerId) {
      clearTimeout(timerId);
    }

    if (selectedBookId === bookId) {
      try {
        await fetch(`http://localhost:5000/books/${bookId}`, {
          method: 'DELETE',
        });
        updateBooks((prevBooks) => prevBooks.filter((book) => book._id !== bookId));
        setSelectedBookId(null);
      } catch (error) {
        console.error('Erro ao deletar o livro:', error);
      }
    } else {
      setSelectedBookId(bookId);
      const newTimerId = setTimeout(() => {
        setSelectedBookId(null);
      }, 3000);
      setTimerId(newTimerId);
    }
  };

  const handleSort = (column) => {
    const isSameColumn = sortOrder.column === column;

    const newAscending = isSameColumn ? !sortOrder.ascending : true;

    setSortOrder({ column, ascending: newAscending });

    setArrowDirection(prevArrowDirection => ({
      ...prevArrowDirection,
      [column]: newAscending ? 'up' : 'down'
    }));

    setTimeout(() => {
      const sortedBooks = books.slice().sort((a, b) => {
        let columnA = a[column];
        let columnB = b[column];

        if (column === 'publishYear') {
          columnA = new Date(a[column].split('/').reverse().join('/'));
          columnB = new Date(b[column].split('/').reverse().join('/'));
        }

        if (newAscending) {
          return columnA < columnB ? -1 : columnA > columnB ? 1 : 0;
        } else {
          return columnA > columnB ? -1 : columnA < columnB ? 1 : 0;
        }
      });

      updateBooks(sortedBooks);
    }, 0);
  };

  const arrowIcon = (column) => {
    if (arrowDirection[column] === 'up') {
      return <AiOutlineArrowDown />;
    } else {
      return <AiOutlineArrowUp />;
    }
  };

  const filteredBooks = filterBooks(books, search);
  const noRecords = filteredBooks.length === 0;

  return (
    <Container>
      <button className="bg-slate-300 hover:opacity-90 p-3 rounded-full fixed bottom-4 left-40 z-10" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <AiOutlineArrowUp size={24} color='black' />
      </button>

      <div className="flex justify-between items-center m-2">
        <div className="flex items-center gap-8">
          <IoLibrary size={40} className="m-2" />

          {
            selectedBookIds.length > 0 && (
              <span className="flex items-center gap-1 bg-red-600 rounded-md p-2 hover:scale-105 transition-all cursor-pointer" onClick={handleDeleteSelected}>
                <AiFillDelete color="white" size={24} />
                <p className="select-none">Deletar</p>
              </span>
            )
          }
        </div>

        <Link to="/books/create">
          <span className="flex items-center gap-1 bg-slate-300 rounded-md p-1 hover:scale-105 transition-all cursor-pointer">
            <IoAddCircle size={30} />
            <p className="select-none">Criar</p>
          </span>
        </Link>
      </div>

      <Table striped bordered hover>
        <thead>
          <tr className="select-none">
            <th className='text-center'>
              {
                noRecords ? (
                  <Form.Check disabled />
                ) : <Form.Check checked={selectAllChecked} onChange={handleSelectAll} />
              }
            </th>
            <th>N°</th>
            <th onClick={() => handleSort('title')}>
              <span className="flex items-center gap-1">Título{sortOrder.column === 'title' && arrowIcon('title')}</span>
            </th>
            <th onClick={() => handleSort('author')}>
              <span className="flex items-center gap-1">Autor{sortOrder.column === 'author' && arrowIcon('author')}</span>
            </th>
            <th onClick={() => handleSort('publishYear')}>
              <span className="flex items-center gap-1">Data de Publicação{sortOrder.column === 'publishYear' && arrowIcon('publishYear')}</span>
            </th>
            <th>Operações</th>
          </tr>
        </thead>

        <tbody>
          {
            filteredBooks.map((book, index) => (
              <tr key={book._id}>
                <td className='text-center'>
                  <Form.Check checked={selectedBookIds.includes(book._id)} onChange={() => handleSingleSelect(book._id)} />
                </td>
                <td className="select-none">{index + 1}</td>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.publishYear}</td>
                <td>
                  <div className="flex justify-center">
                    <Link to={`/books/details/${book._id}`}>
                      <AiOutlineInfoCircle size={24} />
                    </Link>

                    <Link to={`/books/edit/${book._id}`}>
                      <AiOutlineEdit size={24} className="mx-2" />
                    </Link>

                    {
                      selectedBookId === book._id ? (
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
                </td>
              </tr>
            ))
          }

          {
            noRecords && (
              <tr>
                <td colSpan="6" className="text-center">
                  Nenhum registro encontrado!
                </td>
              </tr>
            )
          }
        </tbody>
      </Table>
    </Container>
  );
};

export default BooksTable;
