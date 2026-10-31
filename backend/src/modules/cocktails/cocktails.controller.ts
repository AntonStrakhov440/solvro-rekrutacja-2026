import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { CocktailsService } from './cocktails.service.js';
import { CreateCocktailDto } from './dto/create-cocktail.dto.js';
import { UpdateCocktailDto } from './dto/update-cocktail.dto.js';
import { FilterCocktailDto } from './dto/filter-cocktail.dto.js';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '@/common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy.js';

@ApiTags('cocktails')
@Controller('cocktails')
export class CocktailsController {
  constructor(private readonly cocktailsService: CocktailsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new cocktail recipe (Authenticated users only)',
  })
  @ApiResponse({ status: 201, description: 'Cocktail successfully created.' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid ingredient IDs.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(
    @Body() createDto: CreateCocktailDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cocktailsService.create(createDto, user);
  }

  @Get()
  @ApiOperation({
    summary:
      'List all cocktails with pagination, advanced filtering (category, alcohol, ingredients, author) and sorting',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of cocktails returned.',
  })
  findAll(@Query() filterDto: FilterCocktailDto) {
    return this.cocktailsService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get full cocktail details, ingredients, reviews, and average rating',
  })
  @ApiResponse({ status: 200, description: 'Cocktail details returned.' })
  @ApiResponse({ status: 404, description: 'Cocktail not found.' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.cocktailsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a cocktail recipe (Author or Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Cocktail successfully updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden: not author or admin.' })
  @ApiResponse({ status: 404, description: 'Cocktail not found.' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateDto: UpdateCocktailDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cocktailsService.update(id, updateDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a cocktail recipe (Author or Admin only)',
  })
  @ApiResponse({ status: 204, description: 'Cocktail successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden: not author or admin.' })
  @ApiResponse({ status: 404, description: 'Cocktail not found.' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cocktailsService.remove(id, user);
  }
}
