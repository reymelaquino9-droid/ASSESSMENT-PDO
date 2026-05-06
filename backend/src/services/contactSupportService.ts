import type { Transporter } from 'nodemailer';
import { ContactSupport, EmailTemplate } from '../models/index.js';
import {
  createContactSupportText,
  defaultContactSupportEmailHtml,
  formatSupportSentDate,
  renderContactSupportEmail,
  sendMailSafe,
} from '../utils/index.js';
import type { ContactSupportPayload } from '../utils/index.js';

type SendContactSupportMessageOptions = {
  body: ContactSupportPayload;
  mailUser?: string;
  supportRecipients: string[];
  transporter: Transporter;
};

export interface EmailSendResult {
  recipient: string;
  success: boolean;
  error?: string;
  recipientNotFound?: boolean;
}

export interface SendContactSupportResult {
  contact: any;
  emailResults: EmailSendResult[];
  allSucceeded: boolean;
}

export const sendContactSupportMessage = async ({
  body,
  mailUser,
  supportRecipients,
  transporter,
}: SendContactSupportMessageOptions): Promise<SendContactSupportResult> => {
  const trimmedName = body.name.trim();
  const trimmedEmail = body.email.trim();
  const trimmedMessage = body.message.trim();
  const sentDate = formatSupportSentDate(new Date());

  const contact = await ContactSupport.create({
    name: trimmedName,
    email: trimmedEmail,
    recipientEmails: supportRecipients,
    message: trimmedMessage,
  });

  const emailData = {
    name: trimmedName,
    email: trimmedEmail,
    message: trimmedMessage,
    sentDate,
  };
  const emailTemplate = await EmailTemplate.findOne({
    isActive: true,
    key: 'contact-support',
  });

  const emailResults: EmailSendResult[] = [];
  let allSucceeded = true;

  for (const recipient of supportRecipients) {
    const result = await sendMailSafe(transporter, {
      from: mailUser,
      to: recipient,
      replyTo: trimmedEmail,
      subject: 'New Contact Support Message',
      text: createContactSupportText(emailData),
      html: renderContactSupportEmail(emailTemplate?.html || defaultContactSupportEmailHtml, emailData),
      onInvalidRecipient: (email, reason) => {
        console.error(`Support recipient does not exist: ${email} — ${reason}`);
       
      },
    });

    emailResults.push({
      recipient,
      success: result.success,
      error: result.error,
      recipientNotFound: result.recipientNotFound,
    });

    if (!result.success) {
      allSucceeded = false;
    }
  }

  return {
    contact,
    emailResults,
    allSucceeded,
  };
};
