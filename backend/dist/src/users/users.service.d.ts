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
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        username: string;
        role: string;
        fullName: string | null;
        email: string | null;
        phone: string | null;
    }[]>;
    create(data: CreateUserDto): import("@prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        username: string;
        role: string;
        fullName: string | null;
        email: string | null;
        phone: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, data: UpdateUserDto): import("@prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        username: string;
        role: string;
        fullName: string | null;
        email: string | null;
        phone: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    delete(id: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        username: string;
        password: string;
        role: string;
        fullName: string | null;
        email: string | null;
        phone: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
export {};
