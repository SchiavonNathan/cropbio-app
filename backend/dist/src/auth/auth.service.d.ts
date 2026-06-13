import { OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService implements OnModuleInit {
    private jwtService;
    private prisma;
    constructor(jwtService: JwtService, prisma: PrismaService);
    onModuleInit(): Promise<void>;
    validateUser(username: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            role: any;
        };
    }>;
}
