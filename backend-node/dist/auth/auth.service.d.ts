import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { UserPublicDto } from './dto/user-public.dto';
import { HashingService } from './hashing/hashing.service';
export declare class AuthService {
    private readonly users;
    private readonly hashing;
    private readonly jwt;
    private readonly logger;
    constructor(users: UsersService, hashing: HashingService, jwt: JwtService);
    register(dto: RegisterDto): Promise<UserPublicDto>;
    login(dto: LoginDto): Promise<LoginResponseDto>;
}
