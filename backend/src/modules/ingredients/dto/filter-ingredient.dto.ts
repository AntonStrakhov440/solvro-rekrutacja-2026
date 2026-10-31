import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto.js';

export class FilterIngredientDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search term matching ingredient name or description',
    example: 'mint',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter ingredients by alcoholic content',
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
}
