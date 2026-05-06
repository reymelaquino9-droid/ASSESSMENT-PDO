import type { Request, Response } from 'express';
import type { Transporter } from 'nodemailer';
import {
  confirmEmailVerificationCode,
  isEmailVerified,
  requestEmailVerificationCode,
  sendContactSupportMessage,
} from '../services/index.js';
import {
  getContactSupportValidationError,
  getEmailValidationError,
  isEmailVerificationCodePayload,
  isEmailVerificationPayload,
} from '../utils/index.js';

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
  confirmVerificationCode: async (req: Request, res: Response) => {
    try {
      if (!isEmailVerificationCodePayload(req.body)) {
        return res.status(400).json({
          code: 'REQUIRED_FIELDS',
          success: false,
          message: 'Email and verification code are required',
        });
      }

      const validationError = await getEmailValidationError(req.body.email);

      if (validationError) {
        return res.status(400).json({
          code: validationError.code,
          success: false,
          message: validationError.message,
        });
      }

      if (!/^\d{6}$/.test(req.body.code.trim())) {
        return res.status(400).json({
          code: 'INVALID_VERIFICATION_CODE',
          success: false,
          message: 'Enter the 6-digit verification code',
        });
      }

      const result = await confirmEmailVerificationCode({
        code: req.body.code,
        email: req.body.email,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: 'Email verified',
      });
    } catch (error) {
      console.error('Confirm verification code error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to verify email',
      });
    }
  },

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

      if (!(await isEmailVerified(req.body.email))) {
        return res.status(403).json({
          code: 'EMAIL_NOT_VERIFIED',
          success: false,
          message: 'Verify your email before sending a support message',
        });
      }

      const { contact, allSucceeded, emailResults } = await sendContactSupportMessage({
        body: req.body,
        mailUser,
        supportRecipients,
        transporter,
      });

      const failedRecipients = emailResults.filter((r) => !r.success);

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

  requestVerificationCode: async (req: Request, res: Response) => {
    try {
      if (!isEmailVerificationPayload(req.body)) {
        return res.status(400).json({
          code: 'REQUIRED_FIELDS',
          success: false,
          message: 'Email address is required',
        });
      }

      const validationError = await getEmailValidationError(req.body.email);

      if (validationError) {
        return res.status(400).json({
          code: validationError.code,
          success: false,
          message: validationError.message,
        });
      }

      if (await isEmailVerified(req.body.email)) {
        return res.json({
          success: true,
          message: 'Email already verified',
          alreadyVerified: true,
        });
      }

      const result = await requestEmailVerificationCode({
        email: req.body.email,
        mailUser,
        transporter,
      });

      res.json({
        success: true,
        message: result.codeAlreadySent
          ? 'Code is still valid. Check your inbox.'
          : 'Verification code sent',
        codeAlreadySent: result.codeAlreadySent,
        codeExpiresAt: result.codeExpiresAt,
      });
    } catch (error: any) {
      console.error('Request verification code error:', error);

      if (error?.message?.includes('Recipient not found')) {
        return res.status(400).json({
          code: 'RECIPIENT_NOT_FOUND',
          success: false,
          message: 'The email address does not exist or cannot receive mail',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to send verification code',
      });
    }
  },
});
