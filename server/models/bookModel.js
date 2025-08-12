import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, 'Preço é obrigatório'],
      get: function (value) {
        return value ? parseFloat(value.toString()) : 0;
      },
      set: function (value) {
        return mongoose.Types.Decimal128.fromString(value.toString());
      },
    },
    isbn: {
      type: String,
      trim: true,
      sparse: true,
      match: [
        /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/,
        'ISBN inválido',
      ],
      index: true,
    },
    genre: {
      type: String,
      trim: true,
      maxlength: [50, 'Gênero deve ter no máximo 50 caracteres'],
      index: true,
    },
    publisher: {
      type: String,
      trim: true,
      maxlength: [100, 'Editora deve ter no máximo 100 caracteres'],
    },
    publishedDate: {
      type: Date,
      validate: {
        validator: function (date) {
          return date <= new Date();
        },
        message: 'Data de publicação não pode ser no futuro',
      },
    },
    pages: {
      type: Number,
    },
    language: {
      type: String,
      trim: true,
      default: 'Português',
    },
    condition: {
      type: String,
      enum: {
        values: ['Novo', 'Seminovo', 'Usado'],
        message: 'Condição deve ser: Novo, Seminovo, ou Usado',
      },
      default: 'Novo',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['disponivel', 'alugado', 'indisponivel', 'vendido'],
        message:
          'Status deve ser: disponivel, alugado, indisponivel ou vendido',
      },
      default: 'disponivel',
      index: true,
    },
    coverUrl: {
      type: String,
      validate: {
        validator: function (url) {
          if (!url) return true;
          // Validação mais flexível para URLs de imagens
          const imageExtensionRegex =
            /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/i;
          const cdnRegex =
            /(amazon\.com|amazonaws\.com|cloudinary\.com|imgur\.com|googleusercontent\.com)/i;
          const validUrlRegex = /^https?:\/\/.+/i;

          return (
            validUrlRegex.test(url) &&
            (imageExtensionRegex.test(url) || cdnRegex.test(url))
          );
        },
        message: 'URL da capa deve ser uma URL válida de imagem',
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      getters: true,
      transform: function (doc, ret) {
        if (ret.price) ret.price = parseFloat(ret.price.toString());
        return ret;
      },
    },
    toObject: {
      getters: true,
      transform: function (doc, ret) {
        if (ret.price) ret.price = parseFloat(ret.price.toString());
        return ret;
      },
    },
  }
);

// Índices compostos para consultas otimizadas
bookSchema.index({ user: 1, createdAt: -1 });
bookSchema.index({ user: 1, status: 1 });
bookSchema.index({ user: 1, genre: 1 });
bookSchema.index({ user: 1, title: 1 });
bookSchema.index({ user: 1, author: 1 });

// Virtual para verificar se o livro está disponível
bookSchema.virtual('isAvailable').get(function () {
  return this.status === 'disponivel';
});

export const Book = mongoose.model('Book', bookSchema);
