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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfsController = exports.PdfsDownloadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const prisma_service_1 = require("../prisma/prisma.service");
let PdfsDownloadController = class PdfsDownloadController {
    serveFile(filename, res) {
        const filePath = (0, path_1.join)(process.cwd(), 'uploads/pdfs', filename);
        if (fs.existsSync(filePath)) {
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/pdf');
            res.sendFile(filePath);
        }
        else {
            res.status(404).send('File not found');
        }
    }
};
exports.PdfsDownloadController = PdfsDownloadController;
__decorate([
    (0, common_1.Get)(':filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PdfsDownloadController.prototype, "serveFile", null);
exports.PdfsDownloadController = PdfsDownloadController = __decorate([
    (0, common_1.Controller)('pdfs/download')
], PdfsDownloadController);
let PdfsController = class PdfsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async uploadPdf(file) {
        const fileBuffer = fs.readFileSync(file.path);
        const hash = (0, crypto_1.createHash)('md5').update(fileBuffer).digest('hex');
        const port = process.env.PORT ?? 3000;
        const pdf = await this.prisma.pdf.create({
            data: {
                name: file.originalname,
                hash,
                url: `http://localhost:${port}/pdfs/download/${file.filename}`
            }
        });
        return { message: 'Upload concluído', pdf };
    }
    async listPdfs() {
        const pdfs = await this.prisma.pdf.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return pdfs.map(pdf => ({
            id: pdf.id,
            name: pdf.name,
            hash: pdf.hash,
            url_download: pdf.url
        }));
    }
    async renamePdf(id, body) {
        const pdf = await this.prisma.pdf.update({
            where: { id },
            data: { name: body.name },
        });
        return { id: pdf.id, name: pdf.name, hash: pdf.hash, url_download: pdf.url };
    }
    async deletePdf(id) {
        const pdf = await this.prisma.pdf.findUnique({ where: { id } });
        if (pdf) {
            const filename = pdf.url.split('/').pop() || '';
            const filePath = (0, path_1.join)(process.cwd(), 'uploads/pdfs', filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            await this.prisma.pdf.delete({ where: { id } });
        }
        return { message: 'Deleted' };
    }
};
exports.PdfsController = PdfsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/pdfs',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, uniqueSuffix + (0, path_1.extname)(file.originalname));
            }
        })
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PdfsController.prototype, "uploadPdf", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PdfsController.prototype, "listPdfs", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PdfsController.prototype, "renamePdf", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PdfsController.prototype, "deletePdf", null);
exports.PdfsController = PdfsController = __decorate([
    (0, common_1.Controller)('pdfs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PdfsController);
//# sourceMappingURL=pdfs.controller.js.map