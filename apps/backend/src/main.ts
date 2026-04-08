import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useWebSocketAdapter(new IoAdapter(app));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Настройка CORS для работы с Vercel и локальной разработкой
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://my-dastarhan.vercel.app', // Твой основной домен фронтенда
      /\.vercel\.app$/,                 // Разрешить превью-деплои Vercel
    ],
    credentials: true,
  });

  // В Railway PORT подставляется автоматически через переменную окружения
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0'); // Добавлении '0.0.0.0' для корректной работы в Docker/Railway
  
  console.log(`Backend is running on port: ${port}`);
}
bootstrap();
