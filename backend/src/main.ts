import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix cho tất cả routes: /api/*
  app.setGlobalPrefix('api');

  // CORS - cho phép frontend gọi API
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // Cho phép gửi cookie (JWT)
  });

  // Global validation pipe - tự động validate DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Loại bỏ các field không có trong DTO
      forbidNonWhitelisted: true, // Throw error nếu gửi field lạ
      transform: true,       // Tự động transform types
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 BrewLite API is running on: http://localhost:${port}/api`);
}
await bootstrap();
