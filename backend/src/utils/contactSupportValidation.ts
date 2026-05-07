import { getEmailDomain, hasValidEmailDomain } from './emailValidation.js';

export type ContactSupportPayload = {
  email: string;
  message: string;
  name: string;
};

type ContactSupportValidationError = {
  code: string;
  message: string;
};

const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-z0-9-]+\.)+[a-z]{2,63}$/i;
const maxNameLength = 80;
const maxEmailLength = 254;
const maxMessageLength = 2000;

const createValidationError = (code: string, message: string): ContactSupportValidationError => ({
  code,
  message,
});

export const isContactSupportPayload = (body: unknown): body is ContactSupportPayload => {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const payload = body as Partial<ContactSupportPayload>;

  return (
    typeof payload.name === 'string' &&
    typeof payload.email === 'string' &&
    typeof payload.message === 'string'
  );
};

export const getEmailValidationError = async (emailValue: unknown) => {
  if (typeof emailValue !== 'string' || !emailValue.trim()) {
    return createValidationError('REQUIRED_FIELDS', 'Email address is required');
  }

  const email = emailValue.trim();

  if (email.length > maxEmailLength || !emailPattern.test(email)) {
    return createValidationError('INVALID_EMAIL_FORMAT', 'Please enter a valid email address');
  }

  const emailDomain = getEmailDomain(email);

  if (!emailDomain || !(await hasValidEmailDomain(emailDomain))) {
    return createValidationError('INVALID_EMAIL_DOMAIN', 'Please use a real email address that can receive replies');
  }

  return null;
};

export const getContactSupportValidationError = async (body: unknown) => {
  if (!isContactSupportPayload(body)) {
    return createValidationError('REQUIRED_FIELDS', 'Name, email, and message are required');
  }

  const name = body.name.trim();
  const email = body.email.trim();
  const message = body.message.trim();

  if (!name || !email || !message) {
    return createValidationError('REQUIRED_FIELDS', 'Name, email, and message are required');
  }

  if (name.length > maxNameLength) {
    return createValidationError('NAME_TOO_LONG', `Name or nickname must be ${maxNameLength} characters or less`);
  }

  const emailValidationError = await getEmailValidationError(email);

  if (emailValidationError) {
    return emailValidationError;
  }

  if (message.length > maxMessageLength) {
    return createValidationError('MESSAGE_TOO_LONG', `Message must be ${maxMessageLength} characters or less`);
  }

  return null;
};
