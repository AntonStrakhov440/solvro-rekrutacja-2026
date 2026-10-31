import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@modules/users/entities/user.entity.js';
import { Ingredient } from '@modules/ingredients/entities/ingredient.entity.js';
import { Cocktail } from '@modules/cocktails/entities/cocktail.entity.js';
import { CocktailIngredient } from '@modules/cocktails/entities/cocktail-ingredient.entity.js';
import { Review } from '@modules/reviews/entities/review.entity.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Ingredient,
      Cocktail,
      CocktailIngredient,
      Review,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
