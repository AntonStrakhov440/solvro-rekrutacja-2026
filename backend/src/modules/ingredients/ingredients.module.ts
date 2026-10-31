import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from './entities/ingredient.entity.js';
import { CocktailIngredient } from '@modules/cocktails/entities/cocktail-ingredient.entity.js';
import { IngredientsService } from './ingredients.service.js';
import { IngredientsController } from './ingredients.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Ingredient, CocktailIngredient])],
  controllers: [IngredientsController],
  providers: [IngredientsService],
  exports: [IngredientsService],
})
export class IngredientsModule {}
