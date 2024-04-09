import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import BackButton from '../components/BackButton';
import Spinner from '../components/Spinner';

const CreateBooks = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publishYear, setPublishYear] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [loading, setLoading] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const handleInputChange = (e) => {
    let inputVal = e.target.value;

    inputVal = inputVal.replace(/\D/g, '');

    if (inputVal.length >= 2) {
      inputVal = inputVal.substring(0, 2) + '/' + inputVal.substring(2);
    }

    if (inputVal.length >= 5) {
      inputVal = inputVal.substring(0, 5) + '/' + inputVal.substring(5);
    }

    inputVal = inputVal.substring(0, 10);
    setPublishYear(inputVal);
  };

  const handleKeyDown = (e) => {
    const selectionStart = e.target.selectionStart;
    const selectionEnd = e.target.selectionEnd;

    if (e.key === 'Backspace' && (selectionStart === 3 || selectionEnd === 3)) {
      e.preventDefault();
      setPublishYear(prevState => prevState.slice(0, 2) + prevState.slice(3));
    }

    if (e.key === 'Backspace' && (selectionStart === 6 || selectionEnd === 6)) {
      e.preventDefault();
      setPublishYear(prevState => prevState.slice(0, 5) + prevState.slice(6));
    }
  };

  const handleSaveBook = () => {
    if (!title || !author || !publishYear) {
      enqueueSnackbar('Por favor, preencha todos os campos obrigatórios.', { variant: 'error', autoHideDuration: 3000 });
      return;
    }

    const data = { title, author, publishYear, synopsis };

    setLoading(true);

    axios.post('http://localhost:5000/books', data)
      .then(() => {
        setLoading(false);
        enqueueSnackbar('Registro Criado!', { variant: 'success', autoHideDuration: 3000 });
      })
      .catch((error) => {
        setLoading(false);
        enqueueSnackbar(error, { variant: 'error', autoHideDuration: 3000, preventDuplicate: true });
      });
  };

  return (
    <div className='mt-24'>
      <div className='flex flex-col border-1 border-slate-600 rounded-md shadow-lg w-1/3 p-4 m-auto'>
        <BackButton />

        <h1 className='text-2xl m-auto mb-4'>Criar Registro</h1>

        <Form.Group className='my-2'>
          <Form.Label>Título</Form.Label>
          <Form.Control
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Form.Group>

        <Form.Group className='my-2'>
          <Form.Label>Autor</Form.Label>
          <Form.Control
            type='text'
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </Form.Group>

        <Form.Group className='my-2'>
          <Form.Label>Data de Publicação</Form.Label>
          <Form.Control
            type='text'
            value={publishYear}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
        </Form.Group>

        <Form.Group className='my-2'>
          <Form.Label>Sinopse</Form.Label>
          <Form.Control
            as='textarea'
            rows={6}
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            className='resize-none'
          />
        </Form.Group>

        <Button onClick={handleSaveBook} variant='dark' className='bg-gray-800'>Salvar</Button>

        <span className="m-auto mt-2">
          {
            loading && <Spinner size='sm' />
          }
        </span>
      </div>
    </div>
  );
}

export default CreateBooks