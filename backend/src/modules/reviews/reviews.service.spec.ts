import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { Review } from './entities/review.entity.js';
import { Cocktail } from '@modules/cocktails/entities/cocktail.entity.js';
import { UserRole } from '@modules/users/entities/user.entity.js';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepository: any;
  let cocktailRepository: any;

  const mockUser = {
    id: 'reviewer-user-id',
    userId: 'reviewer-user-id',
    email: 'reviewer@example.com',
    username: 'reviewer',
    roles: [UserRole.USER],
  };

  const mockAdmin = {
    id: 'admin-user-id',
    userId: 'admin-user-id',
    email: 'admin@example.com',
    username: 'admin',
    roles: [UserRole.ADMIN, UserRole.USER],
  };

  const mockCocktail = {
    id: 'cocktail-uuid-1',
    name: 'Mojito',
    authorId: 'different-author-id',
  };

  const mockReview: Review = {
    id: 'review-uuid-1',
    cocktailId: mockCocktail.id,
    authorId: mockUser.id,
    rating: 5,
    comment: 'Great drink!',
    cocktail: null as any,
    author: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    reviewRepository = {
      findOne: vi.fn(),
      findAndCount: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    cocktailRepository = {
      findOne: vi.fn(),
      count: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useValue: reviewRepository,
        },
        {
          provide: getRepositoryToken(Cocktail),
          useValue: cocktailRepository,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = { rating: 5, comment: 'Great drink!' };

    it('should create and return a review when user has not reviewed yet', async () => {
      cocktailRepository.findOne.mockResolvedValue(mockCocktail);
      reviewRepository.findOne.mockResolvedValue(null);
      reviewRepository.create.mockReturnValue(mockReview);
      reviewRepository.save.mockResolvedValue(mockReview);

      const result = await service.create(mockCocktail.id, createDto, mockUser);
      expect(result).toEqual(mockReview);
      expect(reviewRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when cocktail does not exist', async () => {
      cocktailRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('unknown-cocktail', createDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when author tries to review their own cocktail', async () => {
      const authorUser = {
        id: mockCocktail.authorId,
        userId: mockCocktail.authorId,
        email: 'author@example.com',
        username: 'author',
        roles: [UserRole.USER],
      };
      cocktailRepository.findOne.mockResolvedValue(mockCocktail);

      await expect(
        service.create(mockCocktail.id, createDto, authorUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when user has already reviewed the cocktail', async () => {
      cocktailRepository.findOne.mockResolvedValue(mockCocktail);
      reviewRepository.findOne.mockResolvedValue(mockReview);

      await expect(
        service.create(mockCocktail.id, createDto, mockUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should allow review author to delete their review', async () => {
      reviewRepository.findOne.mockResolvedValue(mockReview);
      reviewRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(mockReview.id, mockUser);
      expect(reviewRepository.delete).toHaveBeenCalledWith(mockReview.id);
    });

    it('should allow admin to delete any review', async () => {
      reviewRepository.findOne.mockResolvedValue(mockReview);
      reviewRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(mockReview.id, mockAdmin);
      expect(reviewRepository.delete).toHaveBeenCalledWith(mockReview.id);
    });

    it('should throw ForbiddenException if user is neither author nor admin', async () => {
      reviewRepository.findOne.mockResolvedValue(mockReview);
      const otherUser = {
        id: 'random-user',
        userId: 'random-user',
        email: 'random@example.com',
        username: 'random',
        roles: [UserRole.USER],
      };

      await expect(
        service.remove(mockReview.id, otherUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
