import React, { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import Spinner from '../components/Spinner';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const EditBook = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publishYear, setPublishYear] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {id} = useParams();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:5000/books/${id}`)
    .then((response) => {
        setAuthor(response.data.author);
        setPublishYear(response.data.publishYear)
        setTitle(response.data.title)
        setSynopsis(response.data.synopsis)
        setLoading(false);
      }).catch((error) => {
        setLoading(false);
        alert('Ocorreu um erro. Por favor, tente novamente.');
        console.log(error);
      });
  }, [])
  
  const handleEditBook = () => {
    const data = {
      title,
      author,
      publishYear,
      synopsis
    };
    setLoading(true);
    axios
      .put(`http://localhost:5000/books/${id}`, data)
      .then(() => {
        setLoading(false);
        enqueueSnackbar('Registro de Livro editado com sucesso', { variant: 'success' });
        navigate('/');
      })
      .catch((error) => {
        setLoading(false);
        enqueueSnackbar('Error', { variant: 'error' });
        console.log(error);
      });
  };

  return (
    <div className='p-4'>
      <BackButton />
      <h1 className='text-3xl my-4'>Editar Registro de Livro</h1>
      {loading ? <Spinner /> : ''}
      <div className='flex flex-col border-2 border-slate-600 rounded-xl w-[600px] p-4 mx-auto'>
        <div className='my-4'>
          <label className='text-xl mr-4 text-gray-500'>Título</label>
          <input
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='border-2 border-gray-500 px-4 py-2 w-full rounded-lg'
          />
        </div>
        <div className='my-4'>
          <label className='text-xl mr-4 text-gray-500'>Autor</label>
          <input
            type='text'
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className='border-2 border-gray-500 px-4 py-2 w-full rounded-lg'
          />
        </div>
        <div className='my-4'>
          <label className='text-xl mr-4 text-gray-500'>Ano de Publicação</label>
          <input
            type='text'
            maxLength={4}
            value={publishYear}
            onChange={(e) => setPublishYear(e.target.value)}
            className='border-2 border-gray-500 px-4 py-2 w-full rounded-lg'
          />
        </div>
        <div className='my-4'>
          <label className='text-xl mr-4 text-gray-500'>Sinopse</label>
          <input
            type='text'
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            className='border-2 border-gray-500 px-4 py-2 w-full rounded-lg'
          />
        </div>
        <button className='p-2 bg-slate-600 m-8 text-white rounded-3xl' onClick={handleEditBook}>
          Salvar
        </button>
      </div>
    </div>
  )
}

export default EditBook