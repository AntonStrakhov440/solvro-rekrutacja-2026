import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ example: 42, description: 'Total number of items' })
  totalItems: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ example: true, description: 'Whether next page exists' })
  hasNextPage: boolean;

  @ApiProperty({ example: false, description: 'Whether previous page exists' })
  hasPreviousPage: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;

  constructor(data: T[], totalItems: number, page: number, limit: number) {
    const totalPages = Math.ceil(totalItems / limit) || 1;
    this.data = data;
    this.meta = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
