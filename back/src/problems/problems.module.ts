import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ProblemFilter } from './problem.filter.js';
import { ProblemsController } from './problems.controller.js';
import { ProblemValidationPipe } from './validation.js';

/**
 * Errors as RFC 9457 Problem Details (adrs/0024-problem-details-errors.md):
 * the global validation pipe and exception filter, and the documentation of
 * each kind of problem. Registered here rather than in main.ts so e2e tests get
 * the same behaviour.
 */
@Module({
  controllers: [ProblemsController],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ProblemValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    { provide: APP_FILTER, useClass: ProblemFilter },
  ],
})
export class ProblemsModule {}
