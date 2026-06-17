import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
  BadRequestException, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// ---- Public controller (listing) ----
@Controller('subcategories')
export class SubcategoriesPublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('category') category?: string) {
    const where = category ? { category } : undefined;
    return this.prisma.subcategory.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { pdfs: true } } },
    });
  }
}

// ---- Protected controller (admin CRUD) ----
@Controller('subcategories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubcategoriesAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @Roles('admin')
  async create(@Body() body: { name: string; category: string }) {
    const name = body.name?.trim();
    const category = body.category?.trim();

    if (!name) throw new BadRequestException('O nome da subcategoria é obrigatório.');
    if (!category) throw new BadRequestException('A categoria é obrigatória.');

    const existing = await this.prisma.subcategory.findUnique({
      where: { name_category: { name, category } },
    });
    if (existing) throw new BadRequestException('Já existe uma subcategoria com esse nome nessa categoria.');

    return this.prisma.subcategory.create({ data: { name, category } });
  }

  @Patch(':id')
  @Roles('admin')
  async rename(@Param('id') id: string, @Body() body: { name: string }) {
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('O nome não pode estar vazio.');

    const sub = await this.prisma.subcategory.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subcategoria não encontrada.');

    // Check for name conflict in same category
    const conflict = await this.prisma.subcategory.findUnique({
      where: { name_category: { name, category: sub.category } },
    });
    if (conflict && conflict.id !== id) throw new BadRequestException('Já existe uma subcategoria com esse nome nessa categoria.');

    return this.prisma.subcategory.update({ where: { id }, data: { name } });
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    const sub = await this.prisma.subcategory.findUnique({
      where: { id },
      include: { _count: { select: { pdfs: true } } },
    });
    if (!sub) throw new NotFoundException('Subcategoria não encontrada.');
    if (sub._count.pdfs > 0) {
      throw new BadRequestException(
        `Não é possível excluir: existem ${sub._count.pdfs} PDF(s) vinculados a esta subcategoria.`,
      );
    }
    await this.prisma.subcategory.delete({ where: { id } });
    return { message: 'Subcategoria excluída.' };
  }
}
