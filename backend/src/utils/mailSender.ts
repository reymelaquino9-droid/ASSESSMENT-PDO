import type { Transporter, SendMailOptions } from 'nodemailer';

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipientNotFound?: boolean;
}

export type InvalidRecipientHandler = (email: string, reason: string) => void | Promise<void>;

export interface SendMailSafeOptions extends SendMailOptions {
  onInvalidRecipient?: InvalidRecipientHandler;
}

export const isRecipientNotFoundError = (errorMessage: string): boolean => {
  const patterns = [
    /550/i,
    /551/i,
    /553/i,
    /Recipient address rejected/i,
    /User unknown/i,
    /Mailbox unavailable/i,
    /No such user/i,
    /Invalid recipient/i,
    /does not exist/i,
  ];
  return patterns.some((pattern) => pattern.test(errorMessage));
};

export const sendMailSafe = async (
  transporter: Transporter,
  options: SendMailSafeOptions
): Promise<SendMailResult> => {
  const { onInvalidRecipient, ...mailOptions } = options;

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    const recipientNotFound = isRecipientNotFoundError(errorMessage);

    if (recipientNotFound && onInvalidRecipient && mailOptions.to) {
      const recipients = Array.isArray(mailOptions.to)
        ? mailOptions.to
        : [mailOptions.to];
      for (const recipient of recipients) {
        const email = typeof recipient === 'string' ? recipient : recipient.address;
        if (email) {
          await Promise.resolve(onInvalidRecipient(email, errorMessage));
        }
      }
    }

    return {
      success: false,
      error: errorMessage,
      recipientNotFound,
    };
  }
};
