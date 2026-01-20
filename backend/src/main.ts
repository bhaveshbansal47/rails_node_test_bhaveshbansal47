import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  if (process.env.APP_MODE === 'worker') {
    await app.init();
    console.log('Worker started');
  } else {
    await app.listen(process.env.PORT ?? 3000);
  }
}
bootstrap();
