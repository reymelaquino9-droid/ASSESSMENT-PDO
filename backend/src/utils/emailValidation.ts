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
