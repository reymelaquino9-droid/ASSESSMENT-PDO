import dotenv from 'dotenv';
import { validateSupportRecipientsEnv } from '../utils/index.js';

dotenv.config();

const supportRecipientRaw = process.env.SUPPORT_RECIPIENT || '';
const supportRecipients = validateSupportRecipientsEnv(supportRecipientRaw);

export const env = {
  mailPass: process.env.MAIL_PASS,
  mailUser: process.env.MAIL_USER,
  mongoUri: process.env.MONGO_URI || '',
  port: process.env.PORT || '5000',
  supportRecipient: supportRecipientRaw,
  supportRecipients,
};
