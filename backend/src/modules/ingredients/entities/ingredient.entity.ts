import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { CocktailIngredient } from '@modules/cocktails/entities/cocktail-ingredient.entity.js';

@Entity('ingredients')
export class Ingredient {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 120 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Index()
    @Column({ type: 'boolean', default: false })
    isAlcoholic: boolean;

    @Column({ type: 'varchar', length: 500, nullable: true })
    imageUrl?: string;

    @OneToMany(() => CocktailIngredient, (ci) => ci.ingredient)
    cocktailIngredients: CocktailIngredient[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}