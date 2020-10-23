import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  const config = app.get(ConfigService);
  const port = config.get('PORT');

  await app.listen(port);

  Logger.log(`Api server started on http://localhost:${port}/api`, 'Bootstrap');
}
bootstrap();
