import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { RankingsModule } from './rankings/rankings.module';
import { AuthModule } from './auth/auth.module';
import { ChessComModule } from './chesscom/chesscom.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    TournamentsModule,
    RankingsModule,
    AuthModule,
    ChessComModule,
  ],
})
export class AppModule {}
