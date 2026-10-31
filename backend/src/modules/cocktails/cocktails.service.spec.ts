import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CocktailsService } from './cocktails.service.js';
import { Cocktail, CocktailCategory } from './entities/cocktail.entity.js';
import { CocktailIngredient, MeasureUnit } from './entities/cocktail-ingredient.entity.js';
import { Ingredient } from '@modules/ingredients/entities/ingredient.entity.js';
import { Review } from '@modules/reviews/entities/review.entity.js';
import { UserRole } from '@modules/users/entities/user.entity.js';

describe('CocktailsService', () => {
  let service: CocktailsService;
  let cocktailRepository: any;
  let cocktailIngredientRepository: any;
  let ingredientRepository: any;
  let reviewRepository: any;
  let dataSource: any;

  const mockUser = {
    id: 'user-1111',
    userId: 'user-1111',
    email: 'author@example.com',
    username: 'author',
    roles: [UserRole.USER],
  };

  const mockAdmin = {
    id: 'admin-9999',
    userId: 'admin-9999',
    email: 'admin@example.com',
    username: 'admin',
    roles: [UserRole.ADMIN, UserRole.USER],
  };

  const mockCocktail: any = {
    id: 'cocktail-1111',
    name: 'Mojito',
    category: CocktailCategory.CLASSIC,
    instructions: 'Mix ingredients with crushed ice',
    authorId: mockUser.id,
    cocktailIngredients: [],
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    cocktailRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    cocktailIngredientRepository = {
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    ingredientRepository = {
      find: vi.fn(),
    };

    reviewRepository = {
      createQueryBuilder: vi.fn(),
    };

    dataSource = {
      transaction: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CocktailsService,
        { provide: getRepositoryToken(Cocktail), useValue: cocktailRepository },
        {
          provide: getRepositoryToken(CocktailIngredient),
          useValue: cocktailIngredientRepository,
        },
        {
          provide: getRepositoryToken(Ingredient),
          useValue: ingredientRepository,
        },
        { provide: getRepositoryToken(Review), useValue: reviewRepository },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<CocktailsService>(CocktailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'Mojito',
      category: CocktailCategory.CLASSIC,
      instructions: 'Muddle mint and lime',
      ingredients: [
        {
          ingredientId: 'ing-1',
          amount: 50,
          unit: MeasureUnit.ML,
        },
        {
          ingredientId: 'ing-2',
          amount: 30,
          unit: MeasureUnit.ML,
        },
      ],
    };

    it('should create a cocktail and its ingredients in a transaction', async () => {
      // Arrange
      ingredientRepository.find.mockResolvedValue([
        { id: 'ing-1' },
        { id: 'ing-2' },
      ]);

      const mockManager = {
        getRepository: vi.fn().mockImplementation((entity) => {
          if (entity === Cocktail) {
            return {
              create: vi.fn().mockReturnValue(mockCocktail),
              save: vi.fn().mockResolvedValue(mockCocktail),
            };
          }
          if (entity === CocktailIngredient) {
            return {
              create: vi.fn().mockImplementation((dto) => dto),
              save: vi.fn().mockResolvedValue([]),
            };
          }
          return {};
        }),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => {
        return cb(mockManager);
      });

      vi.spyOn(service, 'findOne').mockResolvedValue({
        ...mockCocktail,
        averageRating: 0,
        reviewsCount: 0,
      });

      // Act
      const result = await service.create(createDto, mockUser);

      // Assert
      expect(ingredientRepository.find).toHaveBeenCalled();
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.name).toBe('Mojito');
    });

    it('should throw BadRequestException when ingredients array contains duplicates', async () => {
      const duplicateDto = {
        ...createDto,
        ingredients: [
          { ingredientId: 'ing-1', amount: 50, unit: MeasureUnit.ML },
          { ingredientId: 'ing-1', amount: 30, unit: MeasureUnit.ML },
        ],
      };

      await expect(service.create(duplicateDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when referenced ingredients do not exist', async () => {
      ingredientRepository.find.mockResolvedValue([{ id: 'ing-1' }]); // only 1 of 2 found

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a cocktail with calculated average rating and review count', async () => {
      // Arrange
      cocktailRepository.findOne.mockResolvedValue(mockCocktail);

      const reviewQb: any = {
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({
          averageRating: '4.50',
          reviewsCount: '2',
        }),
      };
      reviewRepository.createQueryBuilder.mockReturnValue(reviewQb);

      // Act
      const result = await service.findOne(mockCocktail.id);

      // Assert
      expect(cocktailRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCocktail.id },
        relations: {
          author: true,
          cocktailIngredients: { ingredient: true },
          reviews: { author: true },
        },
      });
      expect(result.averageRating).toBe(4.5);
      expect(result.reviewsCount).toBe(2);
    });

    it('should throw NotFoundException when cocktail does not exist', async () => {
      cocktailRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Mojito Updated' };

    it('should allow author to update their own cocktail', async () => {
      cocktailRepository.findOne.mockResolvedValue(mockCocktail);
      dataSource.transaction.mockImplementation(async (cb: any) => {
        const manager = {
          getRepository: vi.fn().mockReturnValue({
            save: vi.fn().mockResolvedValue(mockCocktail),
          }),
        };
        return cb(manager);
      });
      vi.spyOn(service, 'findOne').mockResolvedValue({
        ...mockCocktail,
        name: 'Mojito Updated',
        averageRating: 0,
        reviewsCount: 0,
      });

      const result = await service.update(mockCocktail.id, updateDto, mockUser);
      expect(result.name).toBe('Mojito Updated');
    });

    it('should allow admin to update any cocktail', async () => {
      cocktailRepository.findOne.mockResolvedValue(mockCocktail);
      dataSource.transaction.mockImplementation(async (cb: any) => {
        const manager = {
          getRepository: vi.fn().mockReturnValue({
            save: vi.fn().mockResolvedValue(mockCocktail),
          }),
        };
        return cb(manager);
      });
      vi.spyOn(service, 'findOne').mockResolvedValue({
        ...mockCocktail,
        name: 'Mojito Updated',
        averageRating: 0,
        reviewsCount: 0,
      });

      const result = await service.update(mockCocktail.id, updateDto, mockAdmin);
      expect(result.name).toBe('Mojito Updated');
    });

    it('should throw ForbiddenException when user is not author and not admin', async () => {
      cocktailRepository.findOne.mockResolvedValue(mockCocktail);
      const otherUser = {
        id: 'other-user',
        userId: 'other-user',
        email: 'other@example.com',
        username: 'other',
        roles: [UserRole.USER],
      };

      await expect(
        service.update(mockCocktail.id, updateDto, otherUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should allow author to delete cocktail', async () => {
      cocktailRepository.findOne.mockResolvedValue(mockCocktail);
      cocktailRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(mockCocktail.id, mockUser);
      expect(cocktailRepository.delete).toHaveBeenCalledWith(mockCocktail.id);
    });

    it('should throw ForbiddenException if user is not author or admin', async () => {
      cocktailRepository.findOne.mockResolvedValue(mockCocktail);
      const otherUser = {
        id: 'other-user',
        userId: 'other-user',
        email: 'other@example.com',
        username: 'other',
        roles: [UserRole.USER],
      };

      await expect(
        service.remove(mockCocktail.id, otherUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
