import mongoose from "mongoose";

const bookSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  publishYear: {
    type: String,
    required: true
  },
  synopsis: {
    type: String,
  }
}, {
  timestamps: true
});

export const Book = mongoose.model('Book', bookSchema);
