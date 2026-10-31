import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { CocktailIngredient } from '@modules/cocktails/entities/cocktail-ingredient.entity.js';
import { User } from '@modules/users/entities/user.entity.js';
import { Review } from '@modules/reviews/entities/review.entity.js';

export enum CocktailCategory {
    CLASSIC = 'classic',
    SHORT_DRINK = 'short_drink',
    LONG_DRINK = 'long_drink',
    SHOT = 'shot',
    MOCKTAIL = 'mocktail',
    OTHER = 'other',
}

@Entity('cocktails')
export class Cocktail {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'varchar', length: 150 })
    name: string;

    @Index()
    @Column({
        type: 'enum',
        enum: CocktailCategory,
        default: CocktailCategory.OTHER,
    })
    category: CocktailCategory;

    @Column({ type: 'text' })
    instructions: string;

    @OneToMany(() => CocktailIngredient, (ci) => ci.cocktail, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    cocktailIngredients: Relation<CocktailIngredient>[];

    @Index()
    @Column({ type: 'uuid', nullable: true })
    authorId?: string;

    @ManyToOne(() => User, (user) => user.cocktails, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    @JoinColumn({ name: 'authorId' })
    author?: Relation<User>;

    @OneToMany(() => Review, (review) => review.cocktail)
    reviews: Relation<Review>[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}