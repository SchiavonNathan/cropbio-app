import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CreateUserDto = {
  username: string;
  password: string;
  role: string;
  fullName?: string;
  email?: string;
  phone?: string;
};

type UpdateUserDto = Partial<CreateUserDto>;

const USER_SELECT = {
  id: true,
  username: true,
  role: true,
  fullName: true,
  email: true,
  phone: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { username: 'asc' },
    });
  }

  create(data: CreateUserDto) {
    return this.prisma.user.create({
      data,
      select: USER_SELECT,
    });
  }

  update(id: string, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
