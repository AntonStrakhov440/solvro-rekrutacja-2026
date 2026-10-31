import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
    Index
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Cocktail } from '@modules/cocktails/entities/cocktail.entity.js';
import { Ingredient } from '@modules/ingredients/entities/ingredient.entity.js';

export enum MeasureUnit {
    ML = 'ml',
    CL = 'cl',
    OZ = 'oz',
    GRAMS = 'g',
    PIECES = 'pcs',
    DASH = 'dash',
    LEAVES = 'leaves',
    BARSPOON = 'barspoon',
}

@Entity('cocktail_ingredients')
@Unique(['cocktailId', 'ingredientId'])
export class CocktailIngredient {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid' })
    cocktailId: string;

    @ManyToOne(() => Cocktail, (cocktail) => cocktail.cocktailIngredients, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'cocktailId' })
    cocktail: Relation<Cocktail>;

    @Index()
    @Column({ type: 'uuid' })
    ingredientId: string;

    @ManyToOne(() => Ingredient, (ingredient) => ingredient.cocktailIngredients, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'ingredientId' })
    ingredient: Ingredient;

    @Column({ type: 'decimal', precision: 6, scale: 2 })
    amount: number;

    @Column({ type: 'enum', enum: MeasureUnit, default: MeasureUnit.ML })
    unit: MeasureUnit;
}