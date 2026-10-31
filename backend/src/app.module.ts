import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@modules/auth/auth.module.js';
import { UsersModule } from '@modules/users/users.module.js';
import { IngredientsModule } from '@modules/ingredients/ingredients.module.js';
import { CocktailsModule } from '@modules/cocktails/cocktails.module.js';
import { ReviewsModule } from '@modules/reviews/reviews.module.js';
import { SeedModule } from './database/seeds/seed.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    AuthModule,
    UsersModule,
    IngredientsModule,
    CocktailsModule,
    ReviewsModule,
    SeedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
