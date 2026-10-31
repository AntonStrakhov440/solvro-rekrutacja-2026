import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';
import { MeasureUnit } from '../entities/cocktail-ingredient.entity.js';

export class CocktailIngredientInputDto {
  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'UUID of an existing ingredient',
  })
  @IsUUID()
  @IsNotEmpty()
  ingredientId: string;

  @ApiProperty({
    example: 50,
    description: 'Amount of the ingredient (must be positive)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({
    enum: MeasureUnit,
    example: MeasureUnit.ML,
    description: 'Unit of measurement',
  })
  @IsEnum(MeasureUnit)
  unit: MeasureUnit;
}
