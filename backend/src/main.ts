import { config as dotenvConfig } from 'dotenv';
import { existsSync } from 'fs';
// Prefer .env.local in development
if (existsSync('.env.local')) {
  dotenvConfig({ path: '.env.local' });
} else {
  dotenvConfig();
}
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origin = process.env.FRONTEND_BASE_URL ?? 'http://localhost:3000';
  app.enableCors({ origin, credentials: true });
  const sessionSecret = process.env.SESSION_SECRET || 'dev_only_change_me';
  app.use(cookieParser(sessionSecret));
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
