import axios from 'axios';
import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import InputGroup from 'react-bootstrap/InputGroup';
import BackButton from '../components/BackButton';
import Spinner from '../components/Spinner';

const ShowBook = () => {
  const [book, setBook] = useState({});
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/books/${id}`);
        setBook(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar detalhes do livro:', error);
        setLoading(false);
      }
    };

    fetchBook();
  }, []);

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ' -');
  };

  return (
    <div className='mt-24'>
      {
        loading ? (
          <div className='flex justify-center mt-10'><Spinner /></div>
        ) : (
          <div className='flex flex-col border-1 border-slate-600 rounded-md shadow-lg w-1/3 p-4 m-auto'>
            <BackButton />

            <h1 className='text-2xl m-auto mb-4'>Informações de Registro</h1>

            <InputGroup className='my-2'>
              <InputGroup.Text>Id:</InputGroup.Text>
              <InputGroup.Text>{book._id}</InputGroup.Text>
            </InputGroup>

            <InputGroup className='my-2'>
              <InputGroup.Text>Título:</InputGroup.Text>
              <InputGroup.Text>{book.title}</InputGroup.Text>
            </InputGroup>

            <InputGroup className='my-2'>
              <InputGroup.Text>Autor:</InputGroup.Text>
              <InputGroup.Text>{book.author}</InputGroup.Text>
            </InputGroup>

            <InputGroup className='my-2'>
              <InputGroup.Text>Data de Publicação:</InputGroup.Text>
              <InputGroup.Text>{book.publishYear}</InputGroup.Text>
            </InputGroup>

            <InputGroup className='my-2'>
              <InputGroup.Text>Data de Registro:</InputGroup.Text>
              <InputGroup.Text>{formatDateTime(book.createdAt)}</InputGroup.Text>
            </InputGroup>

            <InputGroup className='my-2'>
              <InputGroup.Text>Data de Atualização:</InputGroup.Text>
              <InputGroup.Text>{formatDateTime(book.updatedAt)}</InputGroup.Text>
            </InputGroup>
          </div>
        )
      }
    </div>
  );
};

export default ShowBook;