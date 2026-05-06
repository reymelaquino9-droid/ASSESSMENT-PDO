import { Router } from 'express';
import type { Transporter } from 'nodemailer';
import ContactSupport from '../models/contactSupport';
import {
  createContactSupportEmail,
  createContactSupportText,
  formatSupportSentDate,
} from '../templates/contactSupportEmail';

const namePattern = /^[\p{L}][\p{L}\s'.-]*$/u;
const nameValidationMessage =
  "Name must start with a letter and can only include letters, spaces, apostrophes, periods, or hyphens.";

type ContactSupportRouterOptions = {
  supportRecipient: string;
  mailUser?: string;
  transporter: Transporter;
};

export const createContactSupportRouter = ({
  supportRecipient,
  mailUser,
  transporter,
}: ContactSupportRouterOptions) => {
  const router = Router();

  router.post('/', async (req, res) => {
    try {
      const { name, email, message } = req.body;

      if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof message !== 'string' ||
        !name.trim() ||
        !email.trim() ||
        !message.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and message are required',
        });
      }

      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const trimmedMessage = message.trim();
      const sentAt = new Date();
      const sentDate = formatSupportSentDate(sentAt);

      if (!namePattern.test(trimmedName)) {
        return res.status(400).json({
          success: false,
          message: nameValidationMessage,
        });
      }

      if (!supportRecipient) {
        return res.status(500).json({
          success: false,
          message: 'Support recipient email is not configured',
        });
      }

      const contact = await ContactSupport.create({
        name: trimmedName,
        email: trimmedEmail,
        recipientEmail: supportRecipient,
        message: trimmedMessage,
      });

      const emailData = {
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
        sentDate,
      };

      await transporter.sendMail({
        from: mailUser,
        to: supportRecipient,
        replyTo: trimmedEmail,
        subject: 'New Contact Support Message',
        text: createContactSupportText(emailData),
        html: createContactSupportEmail(emailData),
      });

      res.status(201).json({
        success: true,
        message: 'Support message saved and email sent',
        data: contact,
      });
    } catch (error) {
      console.error('Contact support error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to send support message',
      });
    }
  });

  return router;
};
