import crypto from 'node:crypto';
import type { Transporter } from 'nodemailer';
import { EmailVerification } from '../models/index.js';
import { sendMailSafe } from '../utils/index.js';

type RequestEmailVerificationCodeOptions = {
  email: string;
  mailUser?: string;
  transporter: Transporter;
};

type ConfirmEmailVerificationCodeOptions = {
  code: string;
  email: string;
};

export type RequestCodeResult = {
  codeAlreadySent: boolean;
  codeExpiresAt: Date;
};

const codeTtlMs = 2 * 60 * 1000;
const verifiedTtlMs = 30 * 60 * 1000;
const maxAttempts = 5;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const createVerificationCode = () => crypto.randomInt(100000, 1000000).toString();

const hashVerificationCode = (email: string, code: string) =>
  crypto.createHash('sha256').update(`${normalizeEmail(email)}:${code.trim()}`).digest('hex');

const createVerificationText = (code: string) =>
  `Your contact support verification code is ${code}.\n\nThis code expires in 2 minutes.`;

const createVerificationHtml = (code: string) => `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;">
    <h1 style="font-size:20px;margin:0 0 12px;">Verify your email</h1>
    <p style="margin:0 0 16px;">Use this code to continue sending your contact support message.</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:0 0 16px;">${code}</p>
    <p style="margin:0;color:#475569;">This code expires in 2 minutes.</p>
  </div>
`;

export const requestEmailVerificationCode = async ({
  email,
  mailUser,
  transporter,
}: RequestEmailVerificationCodeOptions): Promise<RequestCodeResult> => {
  const normalizedEmail = normalizeEmail(email);

  // If an unexpired code already exists, reuse it (no new email sent)
  const existing = await EmailVerification.findOne({
    email: normalizedEmail,
    codeExpiresAt: { $gt: new Date() },
  });

  if (existing) {
    return {
      codeAlreadySent: true,
      codeExpiresAt: existing.codeExpiresAt,
    };
  }

  const code = createVerificationCode();
  const now = new Date();
  const codeExpiresAt = new Date(now.getTime() + codeTtlMs);

  await EmailVerification.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        attempts: 0,
        codeExpiresAt,
        codeHash: hashVerificationCode(normalizedEmail, code),
        email: normalizedEmail,
        verificationExpiresAt: codeExpiresAt,
      },
      $unset: {
        verifiedAt: '',
      },
    },
    { returnDocument: 'after', upsert: true }
  );

  const result = await sendMailSafe(transporter, {
    from: mailUser,
    to: normalizedEmail,
    subject: 'Your contact support verification code',
    text: createVerificationText(code),
    html: createVerificationHtml(code),
    onInvalidRecipient: (recipient, reason) => {
      console.error(`Verification recipient does not exist: ${recipient} — ${reason}`);
    },
  });

  if (!result.success) {
    if (result.recipientNotFound) {
      throw new Error(`Recipient not found: ${normalizedEmail}`);
    }
    throw new Error(`Failed to send verification email: ${result.error}`);
  }

  return {
    codeAlreadySent: false,
    codeExpiresAt,
  };
};

export const confirmEmailVerificationCode = async ({
  code,
  email,
}: ConfirmEmailVerificationCodeOptions) => {
  const normalizedEmail = normalizeEmail(email);
  const verification = await EmailVerification.findOne({ email: normalizedEmail });

  if (!verification) {
    return {
      code: 'VERIFICATION_NOT_FOUND',
      message: 'Request a verification code first',
      success: false,
    };
  }

  if (verification.attempts >= maxAttempts) {
    return {
      code: 'TOO_MANY_VERIFICATION_ATTEMPTS',
      message: 'Request a new verification code',
      success: false,
    };
  }

  if (verification.codeExpiresAt.getTime() < Date.now()) {
    return {
      code: 'VERIFICATION_CODE_EXPIRED',
      message: 'Verification code expired. Request a new code',
      success: false,
    };
  }

  if (verification.codeHash !== hashVerificationCode(normalizedEmail, code)) {
    verification.attempts += 1;
    await verification.save();

    return {
      code: 'INVALID_VERIFICATION_CODE',
      message: 'Enter the correct verification code',
      success: false,
    };
  }

  verification.verifiedAt = new Date();
  verification.verificationExpiresAt = new Date(Date.now() + verifiedTtlMs);
  await verification.save();

  return {
    success: true,
  };
};

export const isEmailVerified = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  const verification = await EmailVerification.findOne({
    email: normalizedEmail,
    verificationExpiresAt: { $gt: new Date() },
    verifiedAt: { $exists: true },
  });

  return Boolean(verification);
};
