import { Module } from '@nestjs/common';
import { InterviewStepsController } from './interview-steps.controller.js';
import { InterviewStepsService } from './interview-steps.service.js';

@Module({
  controllers: [InterviewStepsController],
  providers: [InterviewStepsService],
})
export class InterviewStepsModule {}
