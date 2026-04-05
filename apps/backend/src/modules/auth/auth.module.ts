import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtClientStrategy } from './strategies/jwt-client.strategy';
import { User } from '../users/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { RestaurantUser } from '../restaurants/entities/restaurant-user.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, Client, Restaurant, RestaurantUser, Subscription]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtClientStrategy],
  exports: [AuthService],
})
export class AuthModule {}
