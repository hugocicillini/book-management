import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { CiTrash, CiViewList, CiViewTable } from "react-icons/ci";

import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from '../components/Spinner';
import BooksCard from '../components/home/BooksCard';
import BooksTable from '../components/home/BooksTable';

const Home = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showType, setShowType] = useState('table');
  const [search, setSearch] = useState('');

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setLoading(true);
    axios
      .get('http://localhost:5000/books')
      .then((response) => {
        setBooks(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        enqueueSnackbar(error, { variant: 'error', autoHideDuration: 3000, preventDuplicate: true });
      });
  }, []);

  useEffect(() => {
    const savedShowType = localStorage.getItem('showType');
    const savedSearch = sessionStorage.getItem('search');

    if (savedShowType) {
      setShowType(savedShowType);
    }

    if (savedSearch) {
      setSearch(savedSearch);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('showType', showType);
  }, [showType]);

  useEffect(() => {
    sessionStorage.setItem('search', search);
  }, [search]);

  const updateBooks = (updatedBooks) => {
    setBooks(updatedBooks);
  };

  return (
    <div className='mt-10'>
      <Form className='w-1/5 m-auto'>
        <InputGroup className='mb-10'>
          <Form.Control value={search} onChange={(e) => setSearch(e.target.value)} className='select-none' placeholder='Pesquisar Registros...' />
          {
            search ? (
              <InputGroup.Text className='cursor-pointer' onClick={() => setSearch('')}>
                <CiTrash size={24} />
              </InputGroup.Text>
            ) : (
              <InputGroup.Text>
                <CiTrash size={24} />
              </InputGroup.Text>
            )
          }
        </InputGroup>
      </Form>

      <div className='flex justify-center items-center gap-x-4'>
        <span className={`p-2 cursor-pointer border-2 rounded-full ${showType === 'table' ? 'bg-slate-300' : ''}`} onClick={() => setShowType('table')} >
          <CiViewTable size={24} color='#000000' />
        </span>
        <span className={`p-2 cursor-pointer border-2 rounded-full ${showType === 'card' ? 'bg-slate-300' : ''}`} onClick={() => setShowType('card')} >
          <CiViewList size={24} color='#000000' />
        </span>
      </div>

      {
        loading ? (
          <div className='flex justify-center mt-10'><Spinner /></div>
        ) : showType === 'table' ? (
          <BooksTable books={books} search={search} updateBooks={updateBooks} />
        ) : (
          <BooksCard books={books} search={search} updateBooks={updateBooks} />
        )
      }
    </div>
  );
};

export default Home;
