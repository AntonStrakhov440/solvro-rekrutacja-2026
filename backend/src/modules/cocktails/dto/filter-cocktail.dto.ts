import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto.js';
import { CocktailCategory } from '../entities/cocktail.entity.js';

export class FilterCocktailDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search string matching cocktail name or instructions',
    example: 'mojito',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: CocktailCategory,
    description: 'Filter by cocktail category',
  })
  @IsOptional()
  @IsEnum(CocktailCategory)
  category?: CocktailCategory;

  @ApiPropertyOptional({
    description:
      'Filter by alcoholic content: false returns only mocktails / cocktails without alcoholic ingredients',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isAlcoholic?: boolean;

  @ApiPropertyOptional({
    description: 'Filter cocktails that include an ingredient with this name',
    example: 'mint',
  })
  @IsOptional()
  @IsString()
  ingredientName?: string;

  @ApiPropertyOptional({
    description: 'Filter cocktails containing this specific ingredient ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  ingredientId?: string;

  @ApiPropertyOptional({
    description: 'Filter cocktails created by a specific user UUID',
  })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['name', 'createdAt', 'rating'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['name', 'createdAt', 'rating'])
  sortBy?: 'name' | 'createdAt' | 'rating' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order direction',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : value)
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
