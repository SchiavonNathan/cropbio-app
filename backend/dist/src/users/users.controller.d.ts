import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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
    create(body: CreateUserDto): Promise<{
        id: string;
        username: string;
        role: string;
        fullName: string | null;
        email: string | null;
        phone: string | null;
    }>;
    update(id: string, body: UpdateUserDto): Promise<{
        id: string;
        username: string;
        role: string;
        fullName: string | null;
        email: string | null;
        phone: string | null;
    }>;
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
