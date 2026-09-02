import { ConfigService } from '@nestjs/config';
import { Argon2HashingService } from './argon2-hashing.service';

/**
 * Verifica que el hashing sea Argon2id con los parámetros OWASP de openapi.yaml
 * (m = 19456, t = 2, p = 1) y que jamás caiga en otro algoritmo.
 */
describe('Argon2HashingService', () => {
  const config = {
    get: <T>(_key: string, def: T): T => def,
  } as unknown as ConfigService;

  const service = new Argon2HashingService(config);
  const PLAIN = 'S3gura-y-larga_2026!';

  it('produce un hash en formato PHC Argon2id con los parámetros OWASP', async () => {
    const hash = await service.hash(PLAIN);
    // El prefijo PHC embebe algoritmo + versión + parámetros: prueba que es
    // Argon2id con m=19456, t=2, p=1 y descarta bcrypt/scrypt/SHA.
    expect(hash.startsWith('$argon2id$v=19$m=19456,t=2,p=1$')).toBe(true);
  });

  it('verify() acepta la contraseña correcta y rechaza la incorrecta', async () => {
    const hash = await service.hash(PLAIN);
    await expect(service.verify(hash, PLAIN)).resolves.toBe(true);
    await expect(service.verify(hash, 'contraseña-incorrecta')).resolves.toBe(false);
  });

  it('verify() devuelve false ante un hash corrupto en lugar de lanzar', async () => {
    await expect(service.verify('no-es-un-hash-phc', PLAIN)).resolves.toBe(false);
  });

  it('needsRehash() es false para un hash recién generado con la política vigente', async () => {
    const hash = await service.hash(PLAIN);
    expect(service.needsRehash(hash)).toBe(false);
  });
});
