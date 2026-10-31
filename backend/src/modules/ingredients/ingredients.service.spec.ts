import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { IngredientsService } from './ingredients.service.js';
import { Ingredient } from './entities/ingredient.entity.js';
import { CocktailIngredient } from '@modules/cocktails/entities/cocktail-ingredient.entity.js';

describe('IngredientsService', () => {
  let service: IngredientsService;
  let ingredientRepository: any;
  let cocktailIngredientRepository: any;

  const mockIngredient: Ingredient = {
    id: 'ing-1111-1111',
    name: 'White Rum',
    description: 'Distilled sugarcane rum',
    isAlcoholic: true,
    imageUrl: 'https://example.com/rum.jpg',
    cocktailIngredients: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    ingredientRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    cocktailIngredientRepository = {
      count: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientsService,
        {
          provide: getRepositoryToken(Ingredient),
          useValue: ingredientRepository,
        },
        {
          provide: getRepositoryToken(CocktailIngredient),
          useValue: cocktailIngredientRepository,
        },
      ],
    }).compile();

    service = module.get<IngredientsService>(IngredientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'White Rum',
      description: 'Sugarcane rum',
      isAlcoholic: true,
    };

    it('should create and return an ingredient when name is unique', async () => {
      ingredientRepository.findOne.mockResolvedValue(null);
      ingredientRepository.create.mockReturnValue(mockIngredient);
      ingredientRepository.save.mockResolvedValue(mockIngredient);

      const result = await service.create(createDto);
      expect(ingredientRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'White Rum' },
      });
      expect(result).toEqual(mockIngredient);
    });

    it('should throw ConflictException when ingredient name already exists', async () => {
      ingredientRepository.findOne.mockResolvedValue(mockIngredient);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return ingredient when found by ID', async () => {
      ingredientRepository.findOne.mockResolvedValue(mockIngredient);

      const result = await service.findOne(mockIngredient.id);
      expect(result).toEqual(mockIngredient);
    });

    it('should throw NotFoundException when ID does not exist', async () => {
      ingredientRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete ingredient when it is not used in any cocktails', async () => {
      ingredientRepository.findOne.mockResolvedValue(mockIngredient);
      cocktailIngredientRepository.count.mockResolvedValue(0);
      ingredientRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(mockIngredient.id);
      expect(cocktailIngredientRepository.count).toHaveBeenCalledWith({
        where: { ingredientId: mockIngredient.id },
      });
      expect(ingredientRepository.delete).toHaveBeenCalledWith(mockIngredient.id);
    });

    it('should throw ConflictException when ingredient is currently in use', async () => {
      ingredientRepository.findOne.mockResolvedValue(mockIngredient);
      cocktailIngredientRepository.count.mockResolvedValue(3); // used in 3 cocktails

      await expect(service.remove(mockIngredient.id)).rejects.toThrow(
        ConflictException,
      );
      expect(ingredientRepository.delete).not.toHaveBeenCalled();
    });
  });
});
