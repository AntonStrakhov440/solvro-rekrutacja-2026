import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '@modules/users/entities/user.entity.js';
import { Ingredient } from '@modules/ingredients/entities/ingredient.entity.js';
import { Cocktail, CocktailCategory } from '@modules/cocktails/entities/cocktail.entity.js';
import { CocktailIngredient, MeasureUnit } from '@modules/cocktails/entities/cocktail-ingredient.entity.js';
import { Review } from '@modules/reviews/entities/review.entity.js';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(Cocktail)
    private readonly cocktailRepository: Repository<Cocktail>,
    @InjectRepository(CocktailIngredient)
    private readonly cocktailIngredientRepository: Repository<CocktailIngredient>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const isSeedDisabled = process.env.DISABLE_SEED === 'true';
    if (isSeedDisabled) {
      return;
    }
    await this.seed();
  }

  async seed(): Promise<void> {
    this.logger.log('Checking database seed status...');

    let admin = await this.userRepository.findOne({
      where: { email: 'admin@solvro.pwr.edu.pl' },
    });
    if (!admin) {
      const passwordHash = await bcrypt.hash('Admin123!', 10);
      admin = this.userRepository.create({
        email: 'admin@solvro.pwr.edu.pl',
        username: 'SolvroAdmin',
        passwordHash,
        roles: [UserRole.ADMIN, UserRole.USER],
      });
      admin = await this.userRepository.save(admin);
      this.logger.log('Seeded admin user: admin@solvro.pwr.edu.pl');
    }

    let bartender = await this.userRepository.findOne({
      where: { email: 'bartender@solvro.pwr.edu.pl' },
    });
    if (!bartender) {
      const passwordHash = await bcrypt.hash('User123!', 10);
      bartender = this.userRepository.create({
        email: 'bartender@solvro.pwr.edu.pl',
        username: 'ProBartender',
        passwordHash,
        roles: [UserRole.USER],
      });
      bartender = await this.userRepository.save(bartender);
      this.logger.log('Seeded bartender user: bartender@solvro.pwr.edu.pl');
    }

    const ingredientsData: Array<Partial<Ingredient>> = [
      {
        name: 'White Rum',
        description: 'Light, crisp Caribbean rum aged in stainless steel or plain oak.',
        isAlcoholic: true,
      },
      {
        name: 'Tequila Blanco',
        description: '100% blue agave unaged Mexican tequila.',
        isAlcoholic: true,
      },
      {
        name: 'London Dry Gin',
        description: 'Classic juniper-forward aromatic distilled gin.',
        isAlcoholic: true,
      },
      {
        name: 'Triple Sec',
        description: 'Sweet, orange-flavored liqueur made from dried orange peels.',
        isAlcoholic: true,
      },
      {
        name: 'Vodka',
        description: 'Neutral distilled spirit with clean finish.',
        isAlcoholic: true,
      },
      {
        name: 'Fresh Lime Juice',
        description: 'Freshly squeezed tart lime juice for cocktail balancing.',
        isAlcoholic: false,
      },
      {
        name: 'Fresh Mint Leaves',
        description: 'Aromatic spearmint leaves for refreshing herbal notes.',
        isAlcoholic: false,
      },
      {
        name: 'Simple Syrup',
        description: 'Equal parts pure cane sugar dissolved in water (1:1).',
        isAlcoholic: false,
      },
      {
        name: 'Club Soda',
        description: 'Crisp carbonated water infused with minerals.',
        isAlcoholic: false,
      },
      {
        name: 'Tonic Water',
        description: 'Carbonated water flavored with quinine and botanicals.',
        isAlcoholic: false,
      },
      {
        name: 'Pineapple Juice',
        description: 'Sweet tropical pineapple juice.',
        isAlcoholic: false,
      },
      {
        name: 'Coconut Cream',
        description: 'Rich and velvety coconut cream.',
        isAlcoholic: false,
      },
    ];

    const ingredientMap = new Map<string, Ingredient>();
    for (const item of ingredientsData) {
      let ing = await this.ingredientRepository.findOne({
        where: { name: item.name },
      });
      if (!ing) {
        ing = this.ingredientRepository.create(item);
        ing = await this.ingredientRepository.save(ing);
      }
      ingredientMap.set(ing.name, ing);
    }
    this.logger.log(`Ensured ${ingredientMap.size} base ingredients exist`);

    const existingCocktailCount = await this.cocktailRepository.count();
    if (existingCocktailCount === 0) {
      const mojito = await this.cocktailRepository.save(
        this.cocktailRepository.create({
          name: 'Classic Mojito',
          category: CocktailCategory.CLASSIC,
          instructions:
            'Gently muddle mint leaves with simple syrup and lime juice in a highball glass. Add white rum and fill the glass with crushed ice. Top with club soda, stir gently, and garnish with a fresh mint sprig and lime wheel.',
          authorId: bartender.id,
        }),
      );

      await this.cocktailIngredientRepository.save([
        this.cocktailIngredientRepository.create({
          cocktailId: mojito.id,
          ingredientId: ingredientMap.get('White Rum')!.id,
          amount: 50,
          unit: MeasureUnit.ML,
        }),
        this.cocktailIngredientRepository.create({
          cocktailId: mojito.id,
          ingredientId: ingredientMap.get('Fresh Lime Juice')!.id,
          amount: 30,
          unit: MeasureUnit.ML,
        }),
        this.cocktailIngredientRepository.create({
          cocktailId: mojito.id,
          ingredientId: ingredientMap.get('Simple Syrup')!.id,
          amount: 20,
          unit: MeasureUnit.ML,
        }),
        this.cocktailIngredientRepository.create({
          cocktailId: mojito.id,
          ingredientId: ingredientMap.get('Fresh Mint Leaves')!.id,
          amount: 8,
          unit: MeasureUnit.LEAVES,
        }),
        this.cocktailIngredientRepository.create({
          cocktailId: mojito.id,
          ingredientId: ingredientMap.get('Club Soda')!.id,
          amount: 60,
          unit: MeasureUnit.ML,
        }),
      ]);

      const virginMojito = await this.cocktailRepository.save(
        this.cocktailRepository.create({
          name: 'Virgin Mojito',
          category: CocktailCategory.MOCKTAIL,
          instructions:
            'Muddle fresh mint with lime juice and simple syrup. Add crushed ice, top with sparkling soda water, and stir well for a crisp non-alcoholic refresher.',
          authorId: admin.id,
        }),
      );

      await this.cocktailIngredientRepository.save([
        this.cocktailIngredientRepository.create({
          cocktailId: virginMojito.id,
          ingredientId: ingredientMap.get('Fresh Lime Juice')!.id,
          amount: 35,
          unit: MeasureUnit.ML,
        }),
        this.cocktailIngredientRepository.create({
          cocktailId: virginMojito.id,
          ingredientId: ingredientMap.get('Simple Syrup')!.id,
          amount: 25,
          unit: MeasureUnit.ML,
        }),
        this.cocktailIngredientRepository.create({
          cocktailId: virginMojito.id,
          ingredientId: ingredientMap.get('Fresh Mint Leaves')!.id,
          amount: 10,
          unit: MeasureUnit.LEAVES,
        }),
        this.cocktailIngredientRepository.create({
          cocktailId: virginMojito.id,
          ingredientId: ingredientMap.get('Club Soda')!.id,
          amount: 120,
          unit: MeasureUnit.ML,
        }),
      ]);

      const margarita = await this.cocktailRepository.save(
        this.cocktailRepository.create({
          name: 'Classic Margarita',
          category: CocktailCategory.CLASSIC,
          instructions:
            'Add Tequila Blanco, Triple Sec, and fresh lime juice into a shaker filled with ice. Shake vigorously for 15 seconds. Strain into a chilled coupe glass with a salt-rimmed edge.',
          authorId: bartender.id,
        }),
      );

      await this.cocktailIngredientRepository.save([
        this.cocktailIngredientRepository.create({
          cocktailId: margarita.id,
          ingredientId: ingredientMap.get('Tequila Blanco')!.id,
          amount: 50,
          unit: MeasureUnit.ML,
        }),
        this.cocktailIngredientRepository.create({
          cocktailId: margarita.id,
          ingredientId: ingredientMap.get('Triple Sec')!.id,
          amount: 25,
          unit: MeasureUnit.ML,
        }),
        this.cocktailIngredientRepository.create({
          cocktailId: margarita.id,
          ingredientId: ingredientMap.get('Fresh Lime Juice')!.id,
          amount: 25,
          unit: MeasureUnit.ML,
        }),
      ]);

      const ginTonic = await this.cocktailRepository.save(
        this.cocktailRepository.create({
          name: 'Gin & Tonic',
          category: CocktailCategory.LONG_DRINK,
          instructions:
            'Fill a Copa glass with large ice cubes. Pour in London Dry Gin and top gently with tonic water. Stir once and garnish with a fresh lime wedge.',
          authorId: bartender.id,
        }),
      );

      await this.cocktailIngredientRepository.save([
        this.cocktailIngredientRepository.create({
          cocktailId: ginTonic.id,
          ingredientId: ingredientMap.get('London Dry Gin')!.id,
          amount: 50,
          unit: MeasureUnit.ML,
        }),
        this.cocktailIngredientRepository.create({
          cocktailId: ginTonic.id,
          ingredientId: ingredientMap.get('Tonic Water')!.id,
          amount: 150,
          unit: MeasureUnit.ML,
        }),
      ]);

      await this.reviewRepository.save([
        this.reviewRepository.create({
          cocktailId: mojito.id,
          authorId: admin.id,
          rating: 5,
          comment: 'Perfect balance of acidity, sweetness, and fresh mint aroma. Best summer drink!',
        }),
        this.reviewRepository.create({
          cocktailId: margarita.id,
          authorId: admin.id,
          rating: 5,
          comment: 'Crisp, citrusy, and authentic Mexican flavor profile.',
        }),
        this.reviewRepository.create({
          cocktailId: virginMojito.id,
          authorId: bartender.id,
          rating: 4,
          comment: 'Great alcohol-free alternative for designated drivers.',
        }),
      ]);

      this.logger.log('Successfully seeded sample cocktails, ingredients, and reviews!');
    }
  }
}
