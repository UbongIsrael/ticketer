import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Support multiple frontend URLs via comma-separated FRONTEND_URL env var
  const extraOrigins = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...extraOrigins,
  ];

  console.log('[CORS] Allowed origins:', allowedOrigins);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
