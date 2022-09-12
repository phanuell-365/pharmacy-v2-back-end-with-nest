import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // set up global prefix for all routes
  app.setGlobalPrefix('/v2/api');

  app.enableCors();

  await app.listen(process.env.PORT);
}

(async () => bootstrap())();
