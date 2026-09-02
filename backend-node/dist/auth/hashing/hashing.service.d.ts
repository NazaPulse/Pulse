export declare abstract class HashingService {
    abstract hash(plain: string): Promise<string>;
    abstract verify(hash: string, plain: string): Promise<boolean>;
    abstract needsRehash(hash: string): boolean;
}
