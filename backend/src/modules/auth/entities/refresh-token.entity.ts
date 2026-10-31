import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '@modules/users/entities/user.entity.js';

@Entity('refresh_tokens')
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    tokenHash: string;

    @Index()
    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, (user) => user.refreshTokens, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    user: Relation<User>;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @Column({ type: 'boolean', default: false })
    isRevoked: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}