import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity.js';
import { Cocktail } from '@modules/cocktails/entities/cocktail.entity.js';
import { ReviewsService } from './reviews.service.js';
import { ReviewsController } from './reviews.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Cocktail])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
