import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: false,
    xFrameOptions: false, // Disable X-Frame-Options to allow iframing (CSP frameAncestors handles it)
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        frameAncestors: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
      },
    },
  }));

  // Enable CORS
  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips out properties that are not part of the DTO
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
