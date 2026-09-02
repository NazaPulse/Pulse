import { Repository } from 'typeorm';
import { User } from './user.entity';
export interface CreateUserData {
    email: string;
    passwordHash: string;
    fullName?: string | null;
}
export declare class UsersService {
    private readonly users;
    constructor(users: Repository<User>);
    findByEmail(email: string): Promise<User | null>;
    existsByEmail(email: string): Promise<boolean>;
    create(data: CreateUserData): Promise<User>;
    updatePasswordHash(id: string, passwordHash: string): Promise<void>;
}
