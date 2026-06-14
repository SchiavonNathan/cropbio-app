import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin', salt);
      
      await this.prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
        },
      });
      console.log('[AuthService] Usuário admin padrão criado no banco com senha criptografada.');
    }
  }

  async validateUser(username: string, pass: string): Promise<any> {
    // 1. Procura o usuário no banco de dados
    const dbUser = await this.prisma.user.findUnique({ where: { username } });

    if (dbUser) {
      // Valida a senha usando bcrypt
      const isMatch = await bcrypt.compare(pass, dbUser.password);
      if (!isMatch) return null;
      
      return { id: dbUser.id, username: dbUser.username, role: dbUser.role };
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
