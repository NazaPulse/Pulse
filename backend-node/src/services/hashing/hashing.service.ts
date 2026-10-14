/**
 * Contrato de hashing de contraseñas.
 *
 * La ÚNICA implementación permitida en Pulse es Argon2id (ver
 * `Argon2HashingService`). Está terminantemente prohibido introducir
 * bcrypt, scrypt legacy, SHA-* «a secas» o cualquier hash sin factor de
 * trabajo configurable (openapi.yaml · RegisterRequest.password).
 */
export abstract class HashingService {
  /** Deriva un hash en formato PHC a partir de una contraseña en texto plano. */
  abstract hash(plain: string): Promise<string>;

  /** Verifica en tiempo constante una contraseña contra un hash PHC almacenado. */
  abstract verify(hash: string, plain: string): Promise<boolean>;

  /** Indica si el hash almacenado quedó por debajo de la política vigente. */
  abstract needsRehash(hash: string): boolean;
}
