import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Get, Res, Param, Delete, Patch, Body } from '@nestjs/common';
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

// Rota pública de download/visualização — sem JWT guard
@Controller('pdfs/download')
export class PdfsDownloadController {
  @Get(':filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads/pdfs', filename);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/pdf');
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
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/pdfs',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + extname(file.originalname));
      }
    })
  }))
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    const fileBuffer = fs.readFileSync(file.path);
    const hash = createHash('md5').update(fileBuffer).digest('hex');

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

  @Get()
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

  @Patch(':id')
  @Roles('admin')
  async renamePdf(@Param('id') id: string, @Body() body: { name: string }) {
    const pdf = await this.prisma.pdf.update({
      where: { id },
      data: { name: body.name },
    });
    return { id: pdf.id, name: pdf.name, hash: pdf.hash, url_download: pdf.url };
  }

  @Delete(':id')
  @Roles('admin')
  async deletePdf(@Param('id') id: string) {
    const pdf = await this.prisma.pdf.findUnique({ where: { id } });
    if (pdf) {
      const filename = pdf.url.split('/').pop() || '';
      const filePath = join(process.cwd(), 'uploads/pdfs', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await this.prisma.pdf.delete({ where: { id } });
    }
    return { message: 'Deleted' };
  }
}
