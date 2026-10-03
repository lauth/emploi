import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { validateEnv } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { InterviewStepsModule } from './interview-steps/interview-steps.module.js';
import { OffersModule } from './offers/offers.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    OffersModule,
    InterviewStepsModule,
  ],
  providers: [
    {
      // Registered here rather than in main.ts so e2e tests get the same validation.
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
