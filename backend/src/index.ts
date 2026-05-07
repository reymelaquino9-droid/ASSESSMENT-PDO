import { createApp } from './app.js';
import { connectDatabase, env } from './config/index.js';
import { seedEmailTemplates } from './services/index.js';
import { validateSupportRecipientsMx } from './utils/index.js';

const startServer = async () => {
  await validateSupportRecipientsMx(env.supportRecipients);
  await connectDatabase();
  await seedEmailTemplates();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`Server is running on http://localhost:${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});
