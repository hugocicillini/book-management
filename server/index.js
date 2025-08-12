import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

import userRoutes from './routes/userRoutes.js';
import bookRoutes from './routes/bookRoutes.js';

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  console.log(req);
  return res.status(200).send('Server running!');
});

app.use('/users', userRoutes);
app.use('/books', bookRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Conected to: MongoDB!🍃');
    app.listen(process.env.PORT, () => {
      console.log(`Server started at: http://localhost:${process.env.PORT} 🚀`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
