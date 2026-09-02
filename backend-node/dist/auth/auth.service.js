"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("typeorm");
const users_service_1 = require("../users/users.service");
const user_public_dto_1 = require("./dto/user-public.dto");
const hashing_service_1 = require("./hashing/hashing.service");
const PG_UNIQUE_VIOLATION = '23505';
const EMAIL_TAKEN_MESSAGE = 'El email ya se encuentra registrado.';
const INVALID_CREDENTIALS_MESSAGE = 'Credenciales inválidas.';
let AuthService = AuthService_1 = class AuthService {
    constructor(users, hashing, jwt) {
        this.users = users;
        this.hashing = hashing;
        this.jwt = jwt;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async register(dto) {
        const email = dto.email.trim().toLowerCase();
        if (await this.users.existsByEmail(email)) {
            throw new common_1.BadRequestException(EMAIL_TAKEN_MESSAGE);
        }
        const passwordHash = await this.hashing.hash(dto.password);
        let user;
        try {
            user = await this.users.create({
                email,
                passwordHash,
                fullName: dto.full_name ?? null,
            });
        }
        catch (err) {
            if (err instanceof typeorm_1.QueryFailedError &&
                err.driverError.code === PG_UNIQUE_VIOLATION) {
                throw new common_1.BadRequestException(EMAIL_TAKEN_MESSAGE);
            }
            throw err;
        }
        return user_public_dto_1.UserPublicDto.fromEntity(user);
    }
    async login(dto) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.users.findByEmail(email);
        if (!user) {
            await this.hashing.hash(dto.password).catch(() => undefined);
            throw new common_1.UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
        }
        const ok = await this.hashing.verify(user.passwordHash, dto.password);
        if (!ok) {
            throw new common_1.UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
        }
        if (this.hashing.needsRehash(user.passwordHash)) {
            try {
                const fresh = await this.hashing.hash(dto.password);
                await this.users.updatePasswordHash(user.id, fresh);
            }
            catch (err) {
                this.logger.warn(`No se pudo re-hashear al usuario ${user.id}: ${err.message}`);
            }
        }
        const payload = { sub: user.id, email: user.email };
        const accessToken = await this.jwt.signAsync(payload);
        return { access_token: accessToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        hashing_service_1.HashingService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map