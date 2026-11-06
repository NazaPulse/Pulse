import { Argon2HashingService } from './argon2-hashing.service';
import { HashingService } from './hashing.service';

/** `HashingService` se resuelve SIEMPRE a Argon2id (perfil OWASP de openapi.yaml). Prohibido bcrypt. */
export const hashingProvider = { provide: HashingService, useClass: Argon2HashingService };
