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
type HashOptions = argon2.Options & { raw?: false };

/** Opciones de Argon2id (variante híbrida obligatoria) según la configuración. */
function argon2Options(config: ConfigService): HashOptions {
  return {
    type: argon2.argon2id,
    memoryCost: config.get<number>('ARGON2_MEMORY_COST', 19456),
    timeCost: config.get<number>('ARGON2_TIME_COST', 2),
    parallelism: config.get<number>('ARGON2_PARALLELISM', 1),
    hashLength: 32,
  };
}

@Injectable()
export class Argon2HashingService extends HashingService {
  private readonly logger = new Logger(Argon2HashingService.name);
  private readonly options: HashOptions;

  constructor(private readonly config: ConfigService) {
    super();
    this.options = argon2Options(this.config);
  }

  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain, this.options);
    } catch (err) {
      // hash corrupto o con formato desconocido: se trata como no coincidente.
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
