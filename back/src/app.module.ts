import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { InterviewStepsModule } from './interview-steps/interview-steps.module.js';
import { OffersModule } from './offers/offers.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProblemsModule } from './problems/problems.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    PrismaModule,
    // Global validation pipe and exception filter (errors as Problem Details).
    ProblemsModule,
    HealthModule,
    OffersModule,
    InterviewStepsModule,
  ],
})
export class AppModule {}
