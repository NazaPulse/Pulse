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
exports.LoginResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class LoginResponseDto {
}
exports.LoginResponseDto = LoginResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token de acceso JWT firmado (Authorization: Bearer <access_token>).',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjFhMmI0Yy01ZDZlLTdmODAtOWExYi0yYzNkNGU1ZjYwNzEifQ.q7m0nS9nT3n2Yy8mS0dQ0vBv0f0m8bqkq2s8y4d1a2c',
    }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "access_token", void 0);
//# sourceMappingURL=login-response.dto.js.map