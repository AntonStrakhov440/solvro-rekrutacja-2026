import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CocktailCategory } from '../entities/cocktail.entity.js';
import { CocktailIngredientInputDto } from './cocktail-ingredient-input.dto.js';

export class UpdateCocktailDto {
  @ApiPropertyOptional({
    example: 'Mojito Deluxe',
    description: 'Updated name of the cocktail',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    enum: CocktailCategory,
    example: CocktailCategory.CLASSIC,
    description: 'Updated cocktail category',
  })
  @IsOptional()
  @IsEnum(CocktailCategory)
  category?: CocktailCategory;

  @ApiPropertyOptional({
    example: 'Updated preparation instructions...',
    description: 'Updated preparation instructions',
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({
    type: [CocktailIngredientInputDto],
    description: 'Replacement list of ingredients with amounts and units',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CocktailIngredientInputDto)
  ingredients?: CocktailIngredientInputDto[];
}
