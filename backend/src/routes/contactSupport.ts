import { Router } from 'express';
import { createContactSupportController } from '../controllers/contactSupportController.js';
import { createMailTransporter, env } from '../config/index.js';

export const createContactSupportRouter = () => {
  const router = Router();
  const controller = createContactSupportController({
    mailUser: env.mailUser,
    supportRecipients: env.supportRecipients,
    transporter: createMailTransporter(),
  });

  router.post('/', controller.create);

  return router;
};
