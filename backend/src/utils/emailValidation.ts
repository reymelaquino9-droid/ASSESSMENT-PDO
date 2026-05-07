import { promises as dns } from 'node:dns';
import { domainToASCII } from 'node:url';

export const isValidEmailSyntax = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export interface ParsedRecipients {
  valid: string[];
  invalid: { email: string; reason: string }[];
}

export const parseSupportRecipients = (recipientString: string): ParsedRecipients => {
  const emails = recipientString
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  const valid: string[] = [];
  const invalid: { email: string; reason: string }[] = [];

  for (const email of emails) {
    if (isValidEmailSyntax(email)) {
      valid.push(email.toLowerCase());
    } else {
      invalid.push({ email, reason: 'Invalid email syntax' });
    }
  }

  return { valid, invalid };
};

export const validateSupportRecipientsEnv = (envValue: string): string[] => {
  if (!envValue) {
    throw new Error('SUPPORT_RECIPIENT is not defined');
  }

  const { valid, invalid } = parseSupportRecipients(envValue);

  if (invalid.length > 0) {
    console.error('\n❌ Invalid support recipient emails detected:');
    for (const { email, reason } of invalid) {
      console.error(`   - ${email}: ${reason}`);
    }
    throw new Error('SUPPORT_RECIPIENT contains invalid email addresses');
  }

  if (valid.length === 0) {
    throw new Error('SUPPORT_RECIPIENT has no valid email addresses');
  }

  console.log(`\n✅ Support recipients validated: ${valid.join(', ')}`);
  return valid;
};

const fallbackDnsServers = ['8.8.8.8', '1.1.1.1'];

export const getEmailDomain = (email: string) => {
  const domain = email.split('@').at(-1)?.toLowerCase();

  if (!domain) {
    return null;
  }

  const asciiDomain = domainToASCII(domain);

  return asciiDomain || null;
};

export const resolveMxRecords = async (domain: string) => {
  try {
    return await dns.resolveMx(domain);
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : null;

    if (code !== 'ECONNREFUSED' && code !== 'ETIMEOUT' && code !== 'ESERVFAIL') {
      throw error;
    }

    const resolver = new dns.Resolver();
    resolver.setServers(fallbackDnsServers);
    return resolver.resolveMx(domain);
  }
};

export const hasValidEmailDomain = async (domain: string) => {
  try {
    const records = await resolveMxRecords(domain);
    return records.some((record) => record.exchange && record.exchange !== '.');
  } catch {
    return false;
  }
};

export const validateSupportRecipientsMx = async (emails: string[]): Promise<void> => {
  const invalid: { email: string; reason: string }[] = [];

  for (const email of emails) {
    const domain = getEmailDomain(email);
    if (!domain || !(await hasValidEmailDomain(domain))) {
      invalid.push({ email, reason: 'Domain has no valid MX records' });
    }
  }

  if (invalid.length > 0) {
    console.error('\n❌ Support recipient emails with invalid domains detected:');
    for (const { email, reason } of invalid) {
      console.error(`   - ${email}: ${reason}`);
    }
    throw new Error('SUPPORT_RECIPIENT contains email addresses with invalid domains');
  }

  console.log(`\n✅ Support recipients MX validated: ${emails.join(', ')}`);
};
