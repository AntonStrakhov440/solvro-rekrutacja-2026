import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Cocktail } from '@modules/cocktails/entities/cocktail.entity.js';
import { Review } from '@modules/reviews/entities/review.entity.js';
import { RefreshToken } from '@modules/auth/entities/refresh-token.entity.js';

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
    MODERATOR = 'moderator',
}


@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'varchar', length: 100 })
    username: string;

    @Column({ type: 'varchar', length: 255, select: false })
    passwordHash: string;

    @Column({ type: 'enum', enum: UserRole, array: true, default: [UserRole.USER] })
    roles: UserRole[];

    @OneToMany(() => Cocktail, (cocktail) => cocktail.author)
    cocktails: Relation<Cocktail>[];

    @OneToMany(() => Review, (review) => review.author)
    reviews: Review[];

    @OneToMany(() => RefreshToken, (token) => token.user)
    refreshTokens: RefreshToken[];

    @CreateDateColumn({ type: 'timestamptz' , default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}