import {
  Controller, Post, UseInterceptors, UploadedFile,
  UseGuards, Get, Res, Param, Delete, Patch, Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { createHash } from 'crypto';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = 'application/pdf';
const ALLOWED_EXT = '.pdf';

// Rota pública de download/visualização — sem JWT guard
@Controller('pdfs/download')
export class PdfsDownloadController {
  @Get(':filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    // Sanitize filename — prevent path traversal attacks
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = join(process.cwd(), 'uploads/pdfs', safeName);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  }
}

// Rotas protegidas por JWT
@Controller('pdfs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PdfsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      storage: diskStorage({
        destination: './uploads/pdfs',
        filename: (_req, file, cb) => {
          // Use only timestamp + random — do NOT use original name on disk
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, uniqueSuffix + ALLOWED_EXT);
        },
      }),
      fileFilter: (_req, file, cb) => {
        // Validate MIME type reported by the client
        if (file.mimetype !== ALLOWED_MIME) {
          return cb(
            new BadRequestException('Apenas arquivos PDF são permitidos.') as any,
            false,
          );
        }
        // Validate extension
        if (extname(file.originalname).toLowerCase() !== ALLOWED_EXT) {
          return cb(
            new BadRequestException('Extensão de arquivo inválida. Use .pdf') as any,
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const fileBuffer = fs.readFileSync(file.path);

    // Double-check magic bytes: PDF files start with "%PDF"
    if (fileBuffer.slice(0, 4).toString() !== '%PDF') {
      fs.unlinkSync(file.path); // Remove the invalid file
      throw new BadRequestException('O arquivo enviado não é um PDF válido.');
    }

    const hash = createHash('sha256').update(fileBuffer).digest('hex');

    const port = process.env.PORT ?? 3000;
    const url = `http://localhost:${port}/pdfs/download/${file.filename}`;

    const pdf = await this.prisma.pdf.create({
      data: {
        name: file.originalname,
        hash,
        url,
        category: category || 'Produtos e tabelas',
      },
    });

    return { message: 'Upload concluído', pdf };
  }

  @Get()
  async listPdfs() {
    const pdfs = await this.prisma.pdf.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return pdfs.map((pdf) => ({
      id: pdf.id,
      name: pdf.name,
      hash: pdf.hash,
      url_download: pdf.url,
      category: pdf.category,
    }));
  }

  @Patch(':id')
  @Roles('admin')
  async renamePdf(@Param('id') id: string, @Body() body: { name: string }) {
    if (!body.name || body.name.trim().length === 0) {
      throw new BadRequestException('O nome não pode estar vazio.');
    }
    const pdf = await this.prisma.pdf.update({
      where: { id },
      data: { name: body.name.trim() },
    });
    return {
      id: pdf.id,
      name: pdf.name,
      hash: pdf.hash,
      url_download: pdf.url,
      category: pdf.category,
    };
  }

  @Delete(':id')
  @Roles('admin')
  async deletePdf(@Param('id') id: string) {
    const pdf = await this.prisma.pdf.findUnique({ where: { id } });
    if (pdf) {
      const filename = pdf.url.split('/').pop() || '';
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '');
      const filePath = join(process.cwd(), 'uploads/pdfs', safeName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await this.prisma.pdf.delete({ where: { id } });
    }
    return { message: 'Deleted' };
  }
}
