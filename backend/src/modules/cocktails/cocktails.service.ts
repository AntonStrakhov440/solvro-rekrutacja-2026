import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Cocktail } from './entities/cocktail.entity.js';
import { CocktailIngredient } from './entities/cocktail-ingredient.entity.js';
import { Ingredient } from '@modules/ingredients/entities/ingredient.entity.js';
import { Review } from '@modules/reviews/entities/review.entity.js';
import { CreateCocktailDto } from './dto/create-cocktail.dto.js';
import { UpdateCocktailDto } from './dto/update-cocktail.dto.js';
import { FilterCocktailDto } from './dto/filter-cocktail.dto.js';
import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto.js';
import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy.js';
import { UserRole } from '@modules/users/entities/user.entity.js';

export interface CocktailWithStats extends Cocktail {
  averageRating: number;
  reviewsCount: number;
}

@Injectable()
export class CocktailsService {
  constructor(
    @InjectRepository(Cocktail)
    private readonly cocktailRepository: Repository<Cocktail>,
    @InjectRepository(CocktailIngredient)
    private readonly cocktailIngredientRepository: Repository<CocktailIngredient>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createDto: CreateCocktailDto,
    currentUser: AuthenticatedUser,
  ): Promise<CocktailWithStats> {
    const ingredientIds = createDto.ingredients.map((i) => i.ingredientId);
    if (new Set(ingredientIds).size !== ingredientIds.length) {
      throw new BadRequestException('Cocktail cannot contain duplicate ingredients');
    }

    const foundIngredients = await this.ingredientRepository.find({
      where: { id: In(ingredientIds) },
    });

    if (foundIngredients.length !== ingredientIds.length) {
      throw new BadRequestException('One or more referenced ingredients do not exist');
    }

    const savedCocktail = await this.dataSource.transaction(async (manager) => {
      const cocktail = manager.getRepository(Cocktail).create({
        name: createDto.name.trim(),
        category: createDto.category,
        instructions: createDto.instructions,
        authorId: currentUser.id,
      });

      const inserted = await manager.getRepository(Cocktail).save(cocktail);

      const items = createDto.ingredients.map((item) =>
        manager.getRepository(CocktailIngredient).create({
          cocktailId: inserted.id,
          ingredientId: item.ingredientId,
          amount: item.amount,
          unit: item.unit,
        }),
      );

      await manager.getRepository(CocktailIngredient).save(items);
      return inserted;
    });

    return await this.findOne(savedCocktail.id);
  }

  async findAll(
    filterDto: FilterCocktailDto,
  ): Promise<PaginatedResponseDto<CocktailWithStats>> {
    const qb = this.cocktailRepository.createQueryBuilder('cocktail')
      .leftJoinAndSelect('cocktail.author', 'author')
      .leftJoinAndSelect('cocktail.cocktailIngredients', 'ci')
      .leftJoinAndSelect('ci.ingredient', 'ingredient');

    if (filterDto.search) {
      qb.andWhere(
        '(LOWER(cocktail.name) LIKE LOWER(:search) OR LOWER(cocktail.instructions) LIKE LOWER(:search))',
        { search: `%${filterDto.search.trim()}%` },
      );
    }

    if (filterDto.category) {
      qb.andWhere('cocktail.category = :category', {
        category: filterDto.category,
      });
    }

    if (filterDto.authorId) {
      qb.andWhere('cocktail.authorId = :authorId', {
        authorId: filterDto.authorId,
      });
    }

    if (filterDto.ingredientId) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM cocktail_ingredients sub_ci WHERE sub_ci."cocktailId" = cocktail.id AND sub_ci."ingredientId" = :ingredientId)',
        { ingredientId: filterDto.ingredientId },
      );
    }

    if (filterDto.ingredientName) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM cocktail_ingredients sub_ci
          JOIN ingredients sub_ing ON sub_ing.id = sub_ci."ingredientId"
          WHERE sub_ci."cocktailId" = cocktail.id AND LOWER(sub_ing.name) LIKE LOWER(:ingredientName)
        )`,
        { ingredientName: `%${filterDto.ingredientName.trim()}%` },
      );
    }

    if (filterDto.isAlcoholic !== undefined) {
      if (filterDto.isAlcoholic) {
        qb.andWhere(
          `EXISTS (
            SELECT 1 FROM cocktail_ingredients sub_ci
            JOIN ingredients sub_ing ON sub_ing.id = sub_ci."ingredientId"
            WHERE sub_ci."cocktailId" = cocktail.id AND sub_ing."isAlcoholic" = true
          )`,
        );
      } else {
        qb.andWhere(
          `NOT EXISTS (
            SELECT 1 FROM cocktail_ingredients sub_ci
            JOIN ingredients sub_ing ON sub_ing.id = sub_ci."ingredientId"
            WHERE sub_ci."cocktailId" = cocktail.id AND sub_ing."isAlcoholic" = true
          )`,
        );
      }
    }

    qb.addSelect(
      (subQuery) =>
        subQuery
          .select('COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0)', 'averageRating')
          .from(Review, 'r')
          .where('r.cocktailId = cocktail.id'),
      'cocktail_averageRating',
    ).addSelect(
      (subQuery) =>
        subQuery
          .select('COUNT(r.id)', 'reviewsCount')
          .from(Review, 'r')
          .where('r.cocktailId = cocktail.id'),
      'cocktail_reviewsCount',
    );

    const sortOrder = filterDto.sortOrder || 'DESC';
    if (filterDto.sortBy === 'rating') {
      qb.orderBy('cocktail_averageRating', sortOrder);
    } else if (filterDto.sortBy === 'name') {
      qb.orderBy('cocktail.name', sortOrder);
    } else {
      qb.orderBy('cocktail.createdAt', sortOrder);
    }

    qb.skip(filterDto.skip).take(filterDto.limit);

    const { entities, raw } = await qb.getRawAndEntities();
    const totalItems = await qb.getCount();

    const items: CocktailWithStats[] = entities.map((entity, index) => {
      const rawItem = raw.find((r) => r.cocktail_id === entity.id) || raw[index];
      const withStats = entity as CocktailWithStats;
      withStats.averageRating = parseFloat(rawItem?.cocktail_averageRating || '0');
      withStats.reviewsCount = parseInt(rawItem?.cocktail_reviewsCount || '0', 10);
      return withStats;
    });

    return new PaginatedResponseDto(
      items,
      totalItems,
      filterDto.page,
      filterDto.limit,
    );
  }

  async findOne(id: string): Promise<CocktailWithStats> {
    const cocktail = await this.cocktailRepository.findOne({
      where: { id },
      relations: {
        author: true,
        cocktailIngredients: {
          ingredient: true,
        },
        reviews: {
          author: true,
        },
      },
    });

    if (!cocktail) {
      throw new NotFoundException(`Cocktail with ID "${id}" was not found`);
    }

    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COALESCE(ROUND(AVG(review.rating)::numeric, 2), 0)', 'averageRating')
      .addSelect('COUNT(review.id)', 'reviewsCount')
      .where('review.cocktailId = :id', { id })
      .getRawOne();

    const withStats = cocktail as CocktailWithStats;
    withStats.averageRating = parseFloat(stats?.averageRating || '0');
    withStats.reviewsCount = parseInt(stats?.reviewsCount || '0', 10);
    return withStats;
  }

  async update(
    id: string,
    updateDto: UpdateCocktailDto,
    currentUser: AuthenticatedUser,
  ): Promise<CocktailWithStats> {
    const cocktail = await this.cocktailRepository.findOne({ where: { id } });
    if (!cocktail) {
      throw new NotFoundException(`Cocktail with ID "${id}" was not found`);
    }

    this.checkOwnershipOrAdmin(cocktail.authorId, currentUser);

    await this.dataSource.transaction(async (manager) => {
      if (updateDto.name !== undefined) {
        cocktail.name = updateDto.name.trim();
      }
      if (updateDto.category !== undefined) {
        cocktail.category = updateDto.category;
      }
      if (updateDto.instructions !== undefined) {
        cocktail.instructions = updateDto.instructions;
      }

      await manager.getRepository(Cocktail).save(cocktail);

      if (updateDto.ingredients) {
        const ingredientIds = updateDto.ingredients.map((i) => i.ingredientId);
        if (new Set(ingredientIds).size !== ingredientIds.length) {
          throw new BadRequestException('Cocktail cannot contain duplicate ingredients');
        }

        const validIngredients = await this.ingredientRepository.find({
          where: { id: In(ingredientIds) },
        });

        if (validIngredients.length !== ingredientIds.length) {
          throw new BadRequestException('One or more referenced ingredients do not exist');
        }

        await manager.getRepository(CocktailIngredient).delete({ cocktailId: id });

        const newRelations = updateDto.ingredients.map((item) =>
          manager.getRepository(CocktailIngredient).create({
            cocktailId: id,
            ingredientId: item.ingredientId,
            amount: item.amount,
            unit: item.unit,
          }),
        );

        await manager.getRepository(CocktailIngredient).save(newRelations);
      }
    });

    return await this.findOne(id);
  }

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const cocktail = await this.cocktailRepository.findOne({ where: { id } });
    if (!cocktail) {
      throw new NotFoundException(`Cocktail with ID "${id}" was not found`);
    }

    this.checkOwnershipOrAdmin(cocktail.authorId, currentUser);

    await this.cocktailRepository.delete(id);
  }

  private checkOwnershipOrAdmin(
    authorId: string | undefined,
    currentUser: AuthenticatedUser,
  ): void {
    const isAdmin = currentUser.roles?.includes(UserRole.ADMIN);
    if (!isAdmin && authorId !== currentUser.id) {
      throw new ForbiddenException(
        'You do not have permission to modify or delete this cocktail',
      );
    }
  }
}
