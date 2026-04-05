import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default_secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientSecret: process.env.JWT_CLIENT_SECRET || 'default_client_secret',
  clientExpiresIn: process.env.JWT_CLIENT_EXPIRES_IN || '30d',
}));
