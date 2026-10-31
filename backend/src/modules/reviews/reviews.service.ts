import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity.js';
import { Cocktail } from '@modules/cocktails/entities/cocktail.entity.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { PaginationDto } from '@/common/dto/pagination.dto.js';
import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto.js';
import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy.js';
import { UserRole } from '@modules/users/entities/user.entity.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Cocktail)
    private readonly cocktailRepository: Repository<Cocktail>,
  ) {}

  async create(
    cocktailId: string,
    createDto: CreateReviewDto,
    currentUser: AuthenticatedUser,
  ): Promise<Review> {
    const cocktail = await this.cocktailRepository.findOne({
      where: { id: cocktailId },
    });

    if (!cocktail) {
      throw new NotFoundException(`Cocktail with ID "${cocktailId}" was not found`);
    }

    if (cocktail.authorId === currentUser.id) {
      throw new BadRequestException('Authors cannot review their own cocktails');
    }

    const existingReview = await this.reviewRepository.findOne({
      where: { cocktailId, authorId: currentUser.id },
    });

    if (existingReview) {
      throw new ConflictException(
        'You have already submitted a review for this cocktail',
      );
    }

    const review = this.reviewRepository.create({
      cocktailId,
      authorId: currentUser.id,
      rating: createDto.rating,
      comment: createDto.comment?.trim(),
    });

    return await this.reviewRepository.save(review);
  }

  async findAllForCocktail(
    cocktailId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Review>> {
    const cocktailExists = await this.cocktailRepository.count({
      where: { id: cocktailId },
    });

    if (!cocktailExists) {
      throw new NotFoundException(`Cocktail with ID "${cocktailId}" was not found`);
    }

    const [items, totalItems] = await this.reviewRepository.findAndCount({
      where: { cocktailId },
      relations: { author: true },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        cocktailId: true,
        authorId: true,
        author: {
          id: true,
          username: true,
        },
      },
      order: { createdAt: 'DESC' },
      skip: paginationDto.skip,
      take: paginationDto.limit,
    });

    return new PaginatedResponseDto(
      items,
      totalItems,
      paginationDto.page,
      paginationDto.limit,
    );
  }

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException(`Review with ID "${id}" was not found`);
    }

    const isAdmin = currentUser.roles?.includes(UserRole.ADMIN);
    if (!isAdmin && review.authorId !== currentUser.id) {
      throw new ForbiddenException(
        'You do not have permission to delete this review',
      );
    }

    await this.reviewRepository.delete(id);
  }
}
