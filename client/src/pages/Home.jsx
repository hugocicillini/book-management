import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { MdAddCircleOutline } from 'react-icons/md';
import { BsCardList, BsList } from "react-icons/bs";
import { IoLibrary } from "react-icons/io5";

import Spinner from '../components/Spinner';
import BooksCard from '../components/home/BooksCard';
import BooksTable from '../components/home/BooksTable';

const Home = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showType, setShowType] = useState('table');

  useEffect(() => {
    setLoading(true);
    axios
      .get('http://localhost:5000/books')
      .then((response) => {
        setBooks(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });
  }, []);

  return (
    <div className='p-60'>
      <div className='flex justify-center items-center gap-x-4'>
        <button
          className='bg-slate-500 hover:bg-slate-600 px-4 py-1 rounded-lg'
          onClick={() => setShowType('table')}
        >
          <BsList color='#fff' />
        </button>
        <button
          className='bg-slate-500 hover:bg-slate-600 px-4 py-1 rounded-lg'
          onClick={() => setShowType('card')}
        >
          <BsCardList color='#fff' />
        </button>
      </div>
      <div className='flex justify-between items-center'>
        <h1><IoLibrary size={40} className='m-4' /></h1>
        <Link to='/books/create'>
          <MdAddCircleOutline size={30} />
        </Link>
      </div>
      {loading ? (
        <Spinner />
      ) : books.length === 0 ? (
        <div className='flex justify-center'>Sem registros</div>
      ) : showType === 'table' ? (
        <BooksTable books={books} />
      ) : (
        <BooksCard books={books} />
      )}
    </div>
  );
};

export default Home;