import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cocktail } from './entities/cocktail.entity.js';
import { CocktailIngredient } from './entities/cocktail-ingredient.entity.js';
import { Ingredient } from '@modules/ingredients/entities/ingredient.entity.js';
import { Review } from '@modules/reviews/entities/review.entity.js';
import { CocktailsService } from './cocktails.service.js';
import { CocktailsController } from './cocktails.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cocktail,
      CocktailIngredient,
      Ingredient,
      Review,
    ]),
  ],
  controllers: [CocktailsController],
  providers: [CocktailsService],
  exports: [CocktailsService],
})
export class CocktailsModule {}
