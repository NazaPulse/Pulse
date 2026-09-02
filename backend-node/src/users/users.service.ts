import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email } });
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.users.existsBy({ email });
  }

  create(data: CreateUserData): Promise<User> {
    const entity = this.users.create({
      email: data.email,
      passwordHash: data.passwordHash,
      fullName: data.fullName ?? null,
    });
    return this.users.save(entity);
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.users.update({ id }, { passwordHash });
  }
}
