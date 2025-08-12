import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { z } from 'zod';

import { Book } from '../models/bookModel.js';
import { User } from '../models/userModel.js';

const router = express.Router();

// Configurações vindas do .env
const JWT_SECRET = process.env.JWT_SECRET;

// Schemas de validação aprimorados
const createBookSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres')
    .trim(),
  author: z
    .string()
    .min(1, 'Autor é obrigatório')
    .max(100, 'Autor deve ter no máximo 100 caracteres')
    .trim(),
  description: z
    .string()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .optional(),
  price: z
    .number()
    .positive('Preço deve ser positivo')
    .max(99999.99, 'Preço deve ser menor que R$ 99.999,99'),
  isbn: z
    .string()
    .max(50, 'ISBN deve ter no máximo 50 caracteres')
    .optional(),
  genre: z
    .string()
    .max(50, 'Gênero deve ter no máximo 50 caracteres')
    .optional(),
  publisher: z
    .string()
    .max(100, 'Editora deve ter no máximo 100 caracteres')
    .optional(),
  publishedDate: z
    .string()
    .datetime()
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
  pages: z
    .number()
    .int()
    .positive('Número de páginas deve ser positivo')
    .max(10000, 'Número de páginas muito alto')
    .optional(),
  language: z
    .string()
    .max(30, 'Idioma deve ter no máximo 30 caracteres')
    .optional(),
  condition: z
    .enum(['Novo', 'Seminovo', 'Usado'])
    .optional(),
  status: z
    .enum(['disponivel', 'alugado', 'indisponivel', 'vendido'])
    .optional(),
  coverUrl: z
    .string()
    .url('URL da capa deve ser válida')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
});

const updateBookSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres')
    .trim()
    .optional(),
  author: z
    .string()
    .min(1, 'Autor é obrigatório')
    .max(100, 'Autor deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .optional(),
  price: z
    .number()
    .positive('Preço deve ser positivo')
    .max(99999.99, 'Preço deve ser menor que R$ 99.999,99')
    .optional(),
  isbn: z
    .string()
    .max(50, 'ISBN deve ter no máximo 50 caracteres')
    .optional(),
  genre: z
    .string()
    .max(50, 'Gênero deve ter no máximo 50 caracteres')
    .optional(),
  publisher: z
    .string()
    .max(100, 'Editora deve ter no máximo 100 caracteres')
    .optional(),
  publishedDate: z
    .string()
    .datetime()
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
  pages: z
    .number()
    .int()
    .positive('Número de páginas deve ser positivo')
    .max(10000, 'Número de páginas muito alto')
    .optional(),
  language: z
    .string()
    .max(30, 'Idioma deve ter no máximo 30 caracteres')
    .optional(),
  condition: z
    .enum(['Novo', 'Seminovo', 'Usado'])
    .optional(),
  status: z
    .enum(['disponivel', 'alugado', 'indisponivel', 'vendido'])
    .optional(),
  coverUrl: z
    .string()
    .url('URL da capa deve ser válida')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
});

const searchSchema = z.object({
  query: z.string().min(1, 'Termo de pesquisa é obrigatório').trim(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

// Middleware de autenticação
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Token de autenticação não fornecido.',
        code: 'NO_TOKEN',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado.',
        code: 'USER_NOT_FOUND',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: 'Conta de usuário está inativa.',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expirado.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(403).json({
      message: 'Token inválido.',
      code: 'INVALID_TOKEN',
    });
  }
};

// Criar livro
router.post('/', authenticateToken, async (req, res) => {
  try {
    const validatedData = createBookSchema.parse(req.body);

    const newBook = new Book({
      ...validatedData,
      user: req.userId,
    });

    await newBook.save();

    // Adicionar livro à coleção do usuário
    req.user.collectionBooks.push(newBook._id);
    await req.user.save();

    return res.status(201).json({
      message: 'Livro criado com sucesso.',
      book: newBook,
      code: 'BOOK_CREATED',
    });
  } catch (error) {
    console.error('Erro ao criar livro:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Dados inválidos.',
        errors: error.errors,
        code: 'VALIDATION_ERROR',
      });
    }

    return res.status(500).json({
      message: 'Erro interno do servidor.',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Buscar livro por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id: bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        message: 'ID de livro inválido.',
        code: 'INVALID_BOOK_ID',
      });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        message: 'Livro não encontrado.',
        code: 'BOOK_NOT_FOUND',
      });
    }

    // Verificar se o livro pertence ao usuário
    if (book.user.toString() !== req.userId) {
      return res.status(403).json({
        message: 'Acesso negado a este livro.',
        code: 'ACCESS_DENIED',
      });
    }

    const formattedBook = {
      ...book.toJSON(),
      price:
        book.price instanceof mongoose.Types.Decimal128
          ? parseFloat(book.price.toString())
          : book.price,
    };

    return res.status(200).json({
      message: 'Livro encontrado.',
      book: formattedBook,
    });
  } catch (error) {
    console.error('Erro ao buscar livro:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor.',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Pesquisar livros
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { query, page, limit } = searchSchema.parse({
      query: req.query.q || req.query.query,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    });

    const skip = (page - 1) * limit;

    // Construir filtro de pesquisa
    const searchFilter = {
      user: req.userId,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    };

    // Se a query for um número, pesquisar também por preço
    const numericQuery = parseFloat(query);
    if (!isNaN(numericQuery)) {
      searchFilter.$or.push({ price: numericQuery });
    }

    const [books, totalCount] = await Promise.all([
      Book.find(searchFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Book.countDocuments(searchFilter),
    ]);

    // Formatar preços
    const formattedBooks = books.map((book) => ({
      ...book,
      price:
        book.price instanceof mongoose.Types.Decimal128
          ? parseFloat(book.price.toString())
          : book.price,
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json({
      message: 'Pesquisa realizada com sucesso.',
      books: formattedBooks,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit,
      },
      searchQuery: query,
    });
  } catch (error) {
    console.error('Erro na pesquisa:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Parâmetros de pesquisa inválidos.',
        errors: error.errors,
        code: 'VALIDATION_ERROR',
      });
    }

    return res.status(500).json({
      message: 'Erro interno do servidor.',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Atualizar livro
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id: bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        message: 'ID de livro inválido.',
        code: 'INVALID_BOOK_ID',
      });
    }

    const validatedData = updateBookSchema.parse(req.body);

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        message: 'Livro não encontrado.',
        code: 'BOOK_NOT_FOUND',
      });
    }

    // Verificar se o livro pertence ao usuário
    if (book.user.toString() !== req.userId) {
      return res.status(403).json({
        message: 'Acesso negado a este livro.',
        code: 'ACCESS_DENIED',
      });
    }

    const updatedBook = await Book.findByIdAndUpdate(bookId, validatedData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      message: 'Livro atualizado com sucesso.',
      book: updatedBook,
      code: 'BOOK_UPDATED',
    });
  } catch (error) {
    console.error('Erro ao atualizar livro:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Dados inválidos.',
        errors: error.errors,
        code: 'VALIDATION_ERROR',
      });
    }

    return res.status(500).json({
      message: 'Erro interno do servidor.',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Deletar livro
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id: bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        message: 'ID de livro inválido.',
        code: 'INVALID_BOOK_ID',
      });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        message: 'Livro não encontrado.',
        code: 'BOOK_NOT_FOUND',
      });
    }

    // Verificar se o livro pertence ao usuário
    if (book.user.toString() !== req.userId) {
      return res.status(403).json({
        message: 'Acesso negado a este livro.',
        code: 'ACCESS_DENIED',
      });
    }

    // Remover da coleção do usuário e deletar livro
    await Promise.all([
      User.findByIdAndUpdate(req.userId, {
        $pull: { collectionBooks: bookId },
      }),
      Book.findByIdAndDelete(bookId),
    ]);

    return res.status(200).json({
      message: 'Livro excluído com sucesso.',
      code: 'BOOK_DELETED',
    });
  } catch (error) {
    console.error('Erro ao deletar livro:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor.',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;
