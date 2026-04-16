import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createClient } from 'redis';
import { User, UserRole } from '../users/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import { Restaurant, RestaurantStatus } from '../restaurants/entities/restaurant.entity';
import { RestaurantUser, RestaurantUserRole } from '../restaurants/entities/restaurant-user.entity';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { SendOtpDto, VerifyOtpDto, LoginDto, RegisterRestaurantDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private redis: ReturnType<typeof createClient>;

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Client) private clientsRepo: Repository<Client>,
    @InjectRepository(Restaurant) private restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(RestaurantUser) private restaurantUsersRepo: Repository<RestaurantUser>,
    @InjectRepository(Subscription) private subscriptionsRepo: Repository<Subscription>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {
    this.redis = createClient({
      socket: {
        host: this.config.get('redis.host'),
        port: this.config.get('redis.port'),
      },
       password: this.config.get('redis.password'),
    });
    this.redis.connect().catch(console.error);
  }

  // ── OTP для клиентов ──────────────────────────────────────────────

  async sendOtp(dto: SendOtpDto) {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await this.redis.set(`otp:${dto.phone}`, code, { EX: 300 }); // 5 мин

    // TODO: заменить на Twilio в production
    console.log(`[OTP] ${dto.phone} → ${code}`);

    return { message: 'OTP sent' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const stored = await this.redis.get(`otp:${dto.phone}`);
    if (!stored || stored !== dto.code) {
      throw new UnauthorizedException('Неверный или истёкший код');
    }

    await this.redis.del(`otp:${dto.phone}`);

    let client = await this.clientsRepo.findOne({ where: { phone: dto.phone } });
    const isNew = !client;

    if (!client) {
      client = this.clientsRepo.create({ phone: dto.phone });
      await this.clientsRepo.save(client);
    }

    const token = this.jwtService.sign(
      { sub: client.id, phone: client.phone },
      {
        secret: this.config.get('jwt.clientSecret'),
        expiresIn: this.config.get('jwt.clientExpiresIn'),
      },
    );

    return { accessToken: token, client, isNew };
  }

  async updateClientProfile(clientId: string, name: string) {
    await this.clientsRepo.update(clientId, { name });
    return this.clientsRepo.findOne({ where: { id: clientId } });
  }

  // ── Email+Password для users (owner/staff) ────────────────────────

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Неверный email или пароль');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Неверный email или пароль');

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.get('jwt.secret'),
        expiresIn: this.config.get('jwt.expiresIn'),
      },
    );

    return { accessToken: token, user };
  }

  async getMe(id: string, type: 'user' | 'client') {
    if (type === 'user') {
      return this.usersRepo.findOne({ where: { id } });
    }
    return this.clientsRepo.findOne({ where: { id } });
  }

  // ── Публичная регистрация ресторана ──────────────────────────────

  async registerRestaurant(dto: RegisterRestaurantDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email уже зарегистрирован');

    const password_hash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      email: dto.email,
      password_hash,
      role: UserRole.OWNER,
    });
    await this.usersRepo.save(user);

    const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now();
    const restaurant = this.restaurantsRepo.create({
      name: dto.name,
      slug,
      address: dto.address,
      cuisine_type: dto.cuisine_type,
      phone: dto.phone,
      working_hours: dto.working_hours,
      status: RestaurantStatus.PENDING,
    });
    await this.restaurantsRepo.save(restaurant);

    const ru = this.restaurantUsersRepo.create({
      user_id: user.id,
      restaurant_id: restaurant.id,
      role: RestaurantUserRole.OWNER,
    });
    await this.restaurantUsersRepo.save(ru);

    // Создаём trial подписку на 14 дней
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 14);
    const sub = this.subscriptionsRepo.create({
      restaurant_id: restaurant.id,
      plan: SubscriptionPlan.START,
      status: SubscriptionStatus.TRIAL,
      trial_ends_at: trialEnds,
    });
    await this.subscriptionsRepo.save(sub);

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      { secret: this.config.get('jwt.secret'), expiresIn: this.config.get('jwt.expiresIn') },
    );

    console.log(`[REGISTER] Новый ресторан: "${dto.name}" (${dto.email}) — статус PENDING`);

    return { accessToken: token, user, restaurant };
  }
}
