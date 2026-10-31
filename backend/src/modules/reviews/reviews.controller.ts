import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { PaginationDto } from '@/common/dto/pagination.dto.js';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '@/common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy.js';

@ApiTags('reviews')
@Controller('cocktails/:cocktailId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Leave a rating and review for a cocktail (Authenticated users only)',
  })
  @ApiResponse({ status: 201, description: 'Review successfully created.' })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or author attempting to review own cocktail.',
  })
  @ApiResponse({
    status: 409,
    description: 'User has already reviewed this cocktail.',
  })
  create(
    @Param('cocktailId', new ParseUUIDPipe()) cocktailId: string,
    @Body() createDto: CreateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviewsService.create(cocktailId, createDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List all reviews for a specific cocktail with pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of reviews returned.',
  })
  findAll(
    @Param('cocktailId', new ParseUUIDPipe()) cocktailId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.reviewsService.findAllForCocktail(cocktailId, paginationDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a review (Author or Admin only)',
  })
  @ApiResponse({ status: 204, description: 'Review successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden: not author or admin.' })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviewsService.remove(id, user);
  }
}
