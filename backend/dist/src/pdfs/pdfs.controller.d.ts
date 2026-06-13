import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
export declare class PdfsDownloadController {
    serveFile(filename: string, res: Response): void;
}
export declare class PdfsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    uploadPdf(file: Express.Multer.File): Promise<{
        message: string;
        pdf: {
            url: string;
            id: string;
            name: string;
            hash: string;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    listPdfs(): Promise<{
        id: string;
        name: string;
        hash: string;
        url_download: string;
    }[]>;
    renamePdf(id: string, body: {
        name: string;
    }): Promise<{
        id: string;
        name: string;
        hash: string;
        url_download: string;
    }>;
    deletePdf(id: string): Promise<{
        message: string;
    }>;
}
