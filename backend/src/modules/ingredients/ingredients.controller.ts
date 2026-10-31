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
import { IngredientsService } from './ingredients.service.js';
import { CreateIngredientDto } from './dto/create-ingredient.dto.js';
import { UpdateIngredientDto } from './dto/update-ingredient.dto.js';
import { FilterIngredientDto } from './dto/filter-ingredient.dto.js';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '@modules/users/guards/roles.guard.js';
import { Roles } from '@/common/decorators/role.decorators.js';
import { UserRole } from '@modules/users/entities/user.entity.js';

@ApiTags('ingredients')
@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new ingredient' })
  @ApiResponse({ status: 201, description: 'Ingredient successfully created.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 409, description: 'Ingredient already exists.' })
  create(@Body() createDto: CreateIngredientDto) {
    return this.ingredientsService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all ingredients with pagination, search, and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of ingredients returned.',
  })
  findAll(@Query() filterDto: FilterIngredientDto) {
    return this.ingredientsService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ingredient details by ID' })
  @ApiResponse({ status: 200, description: 'Ingredient found.' })
  @ApiResponse({ status: 404, description: 'Ingredient not found.' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.ingredientsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ingredient details (Admin only)' })
  @ApiResponse({ status: 200, description: 'Ingredient successfully updated.' })
  @ApiResponse({ status: 404, description: 'Ingredient not found.' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateDto: UpdateIngredientDto,
  ) {
    return this.ingredientsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an ingredient (Admin only)' })
  @ApiResponse({ status: 204, description: 'Ingredient successfully deleted.' })
  @ApiResponse({
    status: 409,
    description: 'Ingredient cannot be deleted because it is in use.',
  })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.ingredientsService.remove(id);
  }
}
