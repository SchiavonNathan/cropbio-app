import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
export declare class PdfsDownloadController {
    serveFile(filename: string, res: Response): void;
}
export declare class PdfsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    uploadPdf(file: Express.Multer.File, category: string): Promise<{
        message: string;
        pdf: {
            id: string;
            name: string;
            hash: string;
            url: string;
            category: string;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    listPdfs(): Promise<{
        id: string;
        name: string;
        hash: string;
        url_download: string;
        category: string;
    }[]>;
    renamePdf(id: string, body: {
        name: string;
    }): Promise<{
        id: string;
        name: string;
        hash: string;
        url_download: string;
        category: string;
    }>;
    deletePdf(id: string): Promise<{
        message: string;
    }>;
}
