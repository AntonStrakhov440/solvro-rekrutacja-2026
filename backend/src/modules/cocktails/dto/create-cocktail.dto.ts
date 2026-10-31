import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CocktailCategory } from '../entities/cocktail.entity.js';
import { CocktailIngredientInputDto } from './cocktail-ingredient-input.dto.js';

export class CreateCocktailDto {
  @ApiProperty({
    example: 'Mojito',
    description: 'Name of the cocktail',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({
    enum: CocktailCategory,
    example: CocktailCategory.CLASSIC,
    description: 'Cocktail category',
  })
  @IsEnum(CocktailCategory)
  category: CocktailCategory;

  @ApiProperty({
    example:
      'Muddle mint leaves with sugar and lime juice. Add rum, top with club soda and crushed ice. Garnish with a mint sprig.',
    description: 'Step-by-step preparation instructions',
  })
  @IsString()
  @IsNotEmpty()
  instructions: string;

  @ApiProperty({
    type: [CocktailIngredientInputDto],
    description: 'List of ingredients with exact amounts and units',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'A cocktail must contain at least one ingredient' })
  @ValidateNested({ each: true })
  @Type(() => CocktailIngredientInputDto)
  ingredients: CocktailIngredientInputDto[];
}
