import { User } from '../../users/user.entity';
export declare class UserPublicDto {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
    updated_at: string;
    static fromEntity(user: User): UserPublicDto;
}
