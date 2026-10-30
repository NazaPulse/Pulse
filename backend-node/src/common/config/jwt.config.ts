import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

/** `JwtModule` firma con `JWT_SECRET` y expira según `JWT_EXPIRES_IN` (.env). */
export const jwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.getOrThrow<string>('JWT_SECRET'),
    signOptions: {
      // `expiresIn` acepta segundos (number) o un lapso estilo `ms` ("3600s").
      expiresIn: config.get<string>('JWT_EXPIRES_IN', '3600s') as `${number}s`,
    },
  }),
});
