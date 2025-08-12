import bcrypt from 'bcrypt';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { z } from 'zod';

import { Book } from '../models/bookModel.js';
import { User } from '../models/userModel.js';

const router = express.Router();

// Configurações de segurança vindas do .env
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Schemas de validação aprimorados
const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(50, 'Username deve ter no máximo 50 caracteres')
    .trim(),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
  isActive: z.boolean().default(true),
  collectionBooks: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID inválido'))
    .default([]),
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username é obrigatório').trim(),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const resetPasswordSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de usuário inválido'),
  newPassword: z
    .string()
    .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
    .max(100, 'Nova senha deve ter no máximo 100 caracteres'),
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
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

// Criar usuário
router.post('/create', async (req, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body);

    // Verificar se username já existe
    const existingUser = await User.findOne({
      username: validatedData.username,
    });
    if (existingUser) {
      return res.status(409).json({
        message: 'Nome de usuário já está em uso.',
        code: 'USERNAME_EXISTS',
      });
    }

    // Hash da senha com salt
    const hashedPassword = await bcrypt.hash(
      validatedData.password,
      SALT_ROUNDS
    );

    const newUser = new User({
      username: validatedData.username,
      password: hashedPassword,
      isActive: validatedData.isActive,
      collectionBooks: validatedData.collectionBooks,
    });

    await newUser.save();

    // Retornar usuário sem a senha
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      isActive: newUser.isActive,
      collectionBooks: newUser.collectionBooks,
      createdAt: newUser.createdAt,
    };

    return res.status(201).json({
      message: 'Usuário criado com sucesso.',
      user: userResponse,
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);

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

// Reset de senha
router.put('/reset', async (req, res) => {
  try {
    const { id, newPassword } = resetPasswordSchema.parse(req.body);

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado.',
        code: 'USER_NOT_FOUND',
      });
    }

    // Hash da nova senha com salt
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      message: 'Senha resetada com sucesso.',
      code: 'PASSWORD_RESET_SUCCESS',
    });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);

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

// Login
router.post('/', async (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    // Buscar usuário
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({
        message: 'Credenciais inválidas.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Credenciais inválidas.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Conta de usuário está inativa.',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      message: 'Login realizado com sucesso.',
      token,
      user: {
        _id: user._id,
        username: user.username,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);

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

// Buscar coleção de livros do usuário autenticado com paginação
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Máximo 100 por página
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Buscar usuário e popular livros com paginação
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado.',
        code: 'USER_NOT_FOUND',
      });
    }

    // Contar total de livros
    const totalBooks = user.collectionBooks.length;
    const totalPages = Math.ceil(totalBooks / limit);

    // Buscar livros com paginação
    const books = await Book.find({
      _id: { $in: user.collectionBooks },
    })
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedBooks = books.map((book) => ({
      ...book,
      price:
        book.price instanceof mongoose.Types.Decimal128
          ? parseFloat(book.price.toString())
          : book.price,
    }));

    return res.status(200).json({
      message: 'Coleção de livros obtida com sucesso.',
      books: formattedBooks,
      pagination: {
        currentPage: page,
        totalPages,
        totalBooks,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar coleção:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor.',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;
