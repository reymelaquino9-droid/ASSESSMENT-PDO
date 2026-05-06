import nodemailer from 'nodemailer';
import { env } from './env.js';

export const createMailTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.mailUser,
      pass: env.mailPass,
    },
  });
