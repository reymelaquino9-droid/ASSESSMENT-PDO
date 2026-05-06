import { EmailTemplate } from '../models/index.js';
import { defaultContactSupportEmailHtml } from '../utils/index.js';

export const seedEmailTemplates = async () => {
  const result = await EmailTemplate.updateOne(
    { key: 'contact-support' },
    {
      $setOnInsert: {
        key: 'contact-support',
        html: defaultContactSupportEmailHtml,
        isActive: true,
        name: 'Contact Support Email',
      },
    },
    { upsert: true }
  );

  if (result.upsertedCount > 0) {
    console.log('📧 Seeded default contact-support email template into database');
  } else {
    console.log('📧 Email template already exists in database');
  }
};
