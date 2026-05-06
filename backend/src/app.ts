import cors from 'cors';
import express from 'express';
import { createContactSupportRouter } from './routes/contactSupport.js';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.send('Backend is running!');
  });

  app.use('/contact-support', createContactSupportRouter());

  return app;
};
