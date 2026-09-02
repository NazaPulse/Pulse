import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { HashingService } from './hashing.service';

/**
 * Implementación de {@link HashingService} basada EXCLUSIVAMENTE en Argon2id.
 *
 * Parámetros por defecto = perfil OWASP documentado en openapi.yaml
 * (RegisterRequest.password): m = 19456 KiB, t = 2, p = 1, hash de 32 bytes,
 * salt aleatorio de 16 bytes por contraseña (lo genera la propia librería con
 * un CSPRNG). El resultado se serializa en formato PHC:
 *   $argon2id$v=19$m=19456,t=2,p=1$<salt-b64>$<hash-b64>
 */
@Injectable()
export class Argon2HashingService extends HashingService {
  private readonly logger = new Logger(Argon2HashingService.name);
  private readonly options: argon2.Options & { raw?: false };

  constructor(private readonly config: ConfigService) {
    super();
    this.options = {
      type: argon2.argon2id, // <- variante híbrida obligatoria
      memoryCost: this.config.get<number>('ARGON2_MEMORY_COST', 19456),
      timeCost: this.config.get<number>('ARGON2_TIME_COST', 2),
      parallelism: this.config.get<number>('ARGON2_PARALLELISM', 1),
      hashLength: 32,
    };
  }

  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain, this.options);
    } catch (err) {
      // Hash corrupto o con formato desconocido: se trata como no coincidente.
      this.logger.warn(`verify() falló para un hash almacenado: ${(err as Error).message}`);
      return false;
    }
  }

  needsRehash(hash: string): boolean {
    try {
      return argon2.needsRehash(hash, this.options);
    } catch {
      return true;
    }
  }
}
