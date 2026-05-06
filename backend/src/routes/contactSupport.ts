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

  router.post('/verification-code', controller.requestVerificationCode);
  router.post('/verification-code/confirm', controller.confirmVerificationCode);
  router.post('/', controller.create);

  return router;
};
