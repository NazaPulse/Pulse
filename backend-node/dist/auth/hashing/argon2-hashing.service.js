"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Argon2HashingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Argon2HashingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const argon2 = __importStar(require("argon2"));
const hashing_service_1 = require("./hashing.service");
let Argon2HashingService = Argon2HashingService_1 = class Argon2HashingService extends hashing_service_1.HashingService {
    constructor(config) {
        super();
        this.config = config;
        this.logger = new common_1.Logger(Argon2HashingService_1.name);
        this.options = {
            type: argon2.argon2id,
            memoryCost: this.config.get('ARGON2_MEMORY_COST', 19456),
            timeCost: this.config.get('ARGON2_TIME_COST', 2),
            parallelism: this.config.get('ARGON2_PARALLELISM', 1),
            hashLength: 32,
        };
    }
    async hash(plain) {
        return argon2.hash(plain, this.options);
    }
    async verify(hash, plain) {
        try {
            return await argon2.verify(hash, plain, this.options);
        }
        catch (err) {
            this.logger.warn(`verify() falló para un hash almacenado: ${err.message}`);
            return false;
        }
    }
    needsRehash(hash) {
        try {
            return argon2.needsRehash(hash, this.options);
        }
        catch {
            return true;
        }
    }
};
exports.Argon2HashingService = Argon2HashingService;
exports.Argon2HashingService = Argon2HashingService = Argon2HashingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], Argon2HashingService);
//# sourceMappingURL=argon2-hashing.service.js.map