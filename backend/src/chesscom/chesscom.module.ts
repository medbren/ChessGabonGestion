import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChessComController } from './chesscom.controller';
import { ChessComService } from './chesscom.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ChessComController],
  providers: [ChessComService],
  exports: [ChessComService],
})
export class ChessComModule {}
