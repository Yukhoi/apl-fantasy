import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { ClubsModule } from './modules/clubs/clubs.module';
import { PlayersModule } from './modules/players/players.module';
import { FixturesModule } from './modules/fixtures/fixtures.module';
import { GameweeksModule } from './modules/gameweeks/gameweeks.module';
import { SeasonsModule } from './modules/seasons/seasons.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ClubsModule,
    PlayersModule,
    FixturesModule,
    GameweeksModule,
    SeasonsModule,
    UsersModule,
    AuthModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}