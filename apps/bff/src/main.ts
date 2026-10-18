import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { config } from './config/index.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(config.server.port)
}

await bootstrap()
