import { Router } from "express";
import { Book } from "../models/bookModel.js";

const router = Router()

router.post("/", async (req, res) => {
  try {
    if (!req.body.title || !req.body.author || !req.body.publishYear || !req.body.synopsis) {
      return res.status(400).send({ message: "Todos os campos são obrigatórios!" })
    }

    const newBook = {
      title: req.body.title,
      author: req.body.author,
      publishYear: req.body.publishYear,
      synopsis: req.body.synopsis
    }

    const book = await Book.create(newBook);

    return res.status(201).send(book);
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
})

router.get("/", async (req, res) => {
  try {
    const books = await Book.find({});

    return res.status(200).json({
      count: books.length,
      data: books
    });
  } catch (error) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
})

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id);

    return res.status(200).json(book);
  } catch (error) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
})

router.put("/:id", async (req, res) => {
  try {
    if (!req.body.title || !req.body.author || !req.body.publishYear || !req.body.synopsis) {
      return res.status(400).send({ message: "Todos os campos são obrigatórios!" })
    }

    const { id } = req.params;

    const result = await Book.findByIdAndUpdate(id, req.body);

    if (!result) {
      return res.status(404).send({ message: "Livro não encontrado!" })
    }

    return res.status(200).send({ message: "Livro atualizado com sucesso!" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
})

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Book.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).send({ message: "Livro não encontrado!" })
    }

    return res.status(200).send({ message: "Livro deletado com sucesso!" });
  }
  catch (error) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
})

export default router