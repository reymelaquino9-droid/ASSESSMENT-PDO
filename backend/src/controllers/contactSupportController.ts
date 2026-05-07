import type { Request, Response } from 'express';
import type { Transporter } from 'nodemailer';
import { sendContactSupportMessage } from '../services/index.js';
import { getContactSupportValidationError } from '../utils/index.js';

type ContactSupportControllerOptions = {
  mailUser?: string;
  supportRecipients: string[];
  transporter: Transporter;
};

export const createContactSupportController = ({
  mailUser,
  supportRecipients,
  transporter,
}: ContactSupportControllerOptions) => ({
  create: async (req: Request, res: Response) => {
    try {
      const validationError = await getContactSupportValidationError(req.body);

      if (validationError) {
        return res.status(400).json({
          code: validationError.code,
          success: false,
          message: validationError.message,
        });
      }

      if (!supportRecipients || supportRecipients.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Support recipient email is not configured',
        });
      }

      const { contact, allSucceeded, emailResults } = await sendContactSupportMessage({
        body: req.body,
        mailUser,
        supportRecipients,
        transporter,
      });

      const failedRecipients = emailResults.filter((r) => !r.success);
      const notFoundRecipients = emailResults.filter((r) => r.recipientNotFound);

      if (notFoundRecipients.length === emailResults.length && emailResults.length > 0) {
        return res.status(400).json({
          code: 'SUPPORT_RECIPIENTS_NOT_FOUND',
          success: false,
          message: 'Support is currently unavailable. All recipient addresses are invalid.',
          emailResults,
        });
      }

      res.status(201).json({
        success: true,
        message: allSucceeded
          ? 'Support message saved and email sent'
          : `Support message saved, but failed to send to ${failedRecipients.length} recipient(s)`,
        data: contact,
        emailResults,
      });
    } catch (error) {
      console.error('Contact support error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to send support message',
      });
    }
  },
});
