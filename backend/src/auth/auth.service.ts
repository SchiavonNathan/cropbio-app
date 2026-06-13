import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  // Garante que o admin padrão existe no banco na inicialização
  async onModuleInit() {
    const existing = await this.prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (!existing) {
      await this.prisma.user.create({
        data: {
          username: 'admin',
          password: 'admin',
          role: 'admin',
        },
      });
      console.log('[AuthService] Usuário admin padrão criado no banco.');
    }
  }

  async validateUser(username: string, pass: string): Promise<any> {
    // 1. Procura o usuário no banco de dados
    const dbUser = await this.prisma.user.findUnique({ where: { username } });

    if (dbUser) {
      // Valida a senha (texto simples por ora)
      if (dbUser.password !== pass) return null;
      return { id: dbUser.id, username: dbUser.username, role: dbUser.role };
    }

    // 2. Fallback mockado: apenas o user padrão
    if (username === 'user' && pass === 'user') {
      return { id: 'mock-id-user', username: 'user', role: 'user' };
    }

    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }
}
