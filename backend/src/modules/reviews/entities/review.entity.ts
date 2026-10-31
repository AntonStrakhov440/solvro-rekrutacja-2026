import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
    Index,
    Check,
} from 'typeorm';
import type { Relation } from 'typeorm'
import { User } from '@modules/users/entities/user.entity.js';
import { Cocktail } from '@modules/cocktails/entities/cocktail.entity.js';

@Entity('reviews')
@Unique(['cocktailId', 'authorId'])
@Check(`"rating" >= 1 AND "rating" <= 5`)
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'smallint' })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment?: string;

    @Index()
    @Column({ type: 'uuid' })
    cocktailId: string;

    @ManyToOne(() => Cocktail, (cocktail) => cocktail.reviews, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'cocktailId' })
    cocktail: Relation<Cocktail>;

    @Index()
    @Column({ type: 'uuid' })
    authorId: string;

    @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'authorId' })
    author: Relation<User>;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}