import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        username: string;
        role: string;
        fullName: string | null;
        email: string | null;
        phone: string | null;
    }[]>;
    create(body: {
        username: string;
        password: string;
        role: string;
        fullName?: string;
        email?: string;
        phone?: string;
    }): import("@prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        username: string;
        role: string;
        fullName: string | null;
        email: string | null;
        phone: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, body: {
        username?: string;
        password?: string;
        role?: string;
        fullName?: string;
        email?: string;
        phone?: string;
    }): import("@prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        username: string;
        role: string;
        fullName: string | null;
        email: string | null;
        phone: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        username: string;
        password: string;
        role: string;
        fullName: string | null;
        email: string | null;
        phone: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
