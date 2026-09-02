import { ConfigService } from '@nestjs/config';
import { HashingService } from './hashing.service';
export declare class Argon2HashingService extends HashingService {
    private readonly config;
    private readonly logger;
    private readonly options;
    constructor(config: ConfigService);
    hash(plain: string): Promise<string>;
    verify(hash: string, plain: string): Promise<boolean>;
    needsRehash(hash: string): boolean;
}
