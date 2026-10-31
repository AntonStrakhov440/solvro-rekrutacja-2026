import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from './entities/ingredient.entity.js';
import { CreateIngredientDto } from './dto/create-ingredient.dto.js';
import { UpdateIngredientDto } from './dto/update-ingredient.dto.js';
import { FilterIngredientDto } from './dto/filter-ingredient.dto.js';
import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto.js';
import { CocktailIngredient } from '@modules/cocktails/entities/cocktail-ingredient.entity.js';

@Injectable()
export class IngredientsService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(CocktailIngredient)
    private readonly cocktailIngredientRepository: Repository<CocktailIngredient>,
  ) {}

  async create(createDto: CreateIngredientDto): Promise<Ingredient> {
    const existing = await this.ingredientRepository.findOne({
      where: { name: createDto.name.trim() },
    });
    if (existing) {
      throw new ConflictException(
        `Ingredient with name "${createDto.name}" already exists`,
      );
    }

    const ingredient = this.ingredientRepository.create({
      name: createDto.name.trim(),
      description: createDto.description,
      isAlcoholic: createDto.isAlcoholic,
      imageUrl: createDto.imageUrl,
    });

    return await this.ingredientRepository.save(ingredient);
  }

  async findAll(
    filterDto: FilterIngredientDto,
  ): Promise<PaginatedResponseDto<Ingredient>> {
    const query = this.ingredientRepository.createQueryBuilder('ingredient');

    if (filterDto.search) {
      query.andWhere(
        '(LOWER(ingredient.name) LIKE LOWER(:search) OR LOWER(ingredient.description) LIKE LOWER(:search))',
        { search: `%${filterDto.search.trim()}%` },
      );
    }

    if (filterDto.isAlcoholic !== undefined) {
      query.andWhere('ingredient.isAlcoholic = :isAlcoholic', {
        isAlcoholic: filterDto.isAlcoholic,
      });
    }

    query
      .orderBy('ingredient.name', 'ASC')
      .skip(filterDto.skip)
      .take(filterDto.limit);

    const [items, totalItems] = await query.getManyAndCount();

    return new PaginatedResponseDto(
      items,
      totalItems,
      filterDto.page,
      filterDto.limit,
    );
  }

  async findOne(id: string): Promise<Ingredient> {
    const ingredient = await this.ingredientRepository.findOne({
      where: { id },
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingredient with ID "${id}" was not found`);
    }

    return ingredient;
  }

  async update(id: string, updateDto: UpdateIngredientDto): Promise<Ingredient> {
    const ingredient = await this.findOne(id);

    if (updateDto.name && updateDto.name.trim() !== ingredient.name) {
      const duplicate = await this.ingredientRepository.findOne({
        where: { name: updateDto.name.trim() },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Ingredient with name "${updateDto.name}" already exists`,
        );
      }
      ingredient.name = updateDto.name.trim();
    }

    if (updateDto.description !== undefined) {
      ingredient.description = updateDto.description;
    }

    if (updateDto.isAlcoholic !== undefined) {
      ingredient.isAlcoholic = updateDto.isAlcoholic;
    }

    if (updateDto.imageUrl !== undefined) {
      ingredient.imageUrl = updateDto.imageUrl;
    }

    return await this.ingredientRepository.save(ingredient);
  }

  async remove(id: string): Promise<void> {
    const ingredient = await this.findOne(id);

    const usageCount = await this.cocktailIngredientRepository.count({
      where: { ingredientId: id },
    });

    if (usageCount > 0) {
      throw new ConflictException(
        `Cannot delete ingredient "${ingredient.name}": it is currently used in ${usageCount} cocktail(s)`,
      );
    }

    await this.ingredientRepository.delete(id);
  }
}
