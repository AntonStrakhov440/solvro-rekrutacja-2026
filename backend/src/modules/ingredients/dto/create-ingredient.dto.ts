import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateIngredientDto {
  @ApiProperty({
    example: 'White Rum',
    description: 'Name of the ingredient (must be unique)',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    example: 'Distilled alcoholic beverage made from sugarcane byproducts.',
    description: 'Detailed description of the ingredient',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Flag indicating whether this ingredient contains alcohol',
    default: false,
  })
  @IsBoolean()
  isAlcoholic: boolean;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-rum.jpg',
    description: 'URL of the ingredient image',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;
}
