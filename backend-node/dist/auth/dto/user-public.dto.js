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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPublicDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class UserPublicDto {
    static fromEntity(user) {
        const dto = new UserPublicDto();
        dto.id = user.id;
        dto.email = user.email;
        dto.full_name = user.fullName ?? null;
        dto.created_at = user.createdAt.toISOString();
        dto.updated_at = user.updatedAt.toISOString();
        return dto;
    }
}
exports.UserPublicDto = UserPublicDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: '3f1a2b4c-5d6e-7f80-9a1b-2c3d4e5f6071' }),
    __metadata("design:type", String)
], UserPublicDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'email', example: 'usuario@pulse.app' }),
    __metadata("design:type", String)
], UserPublicDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: 'Ada Lovelace' }),
    __metadata("design:type", Object)
], UserPublicDto.prototype, "full_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'date-time', example: '2026-08-28T14:03:21.000Z' }),
    __metadata("design:type", String)
], UserPublicDto.prototype, "created_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'date-time', example: '2026-08-28T14:03:21.000Z' }),
    __metadata("design:type", String)
], UserPublicDto.prototype, "updated_at", void 0);
//# sourceMappingURL=user-public.dto.js.map