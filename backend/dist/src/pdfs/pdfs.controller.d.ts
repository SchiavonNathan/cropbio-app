import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
export declare class PdfsDownloadController {
    serveFile(filename: string, res: Response): void;
}
export declare class PdfsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    uploadPdf(file: Express.Multer.File, category: string, subcategoryId: string): Promise<{
        message: string;
        pdf: {
            subcategory: {
                id: string;
                name: string;
                category: string;
                createdAt: Date;
                iconUrl: string | null;
            } | null;
        } & {
            url: string;
            id: string;
            name: string;
            hash: string;
            category: string;
            subcategoryId: string | null;
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
        subcategoryId: string | null;
        subcategoryName: string | null;
    }[]>;
    renamePdf(id: string, body: {
        name?: string;
        subcategoryId?: string;
    }): Promise<{
        id: string;
        name: string;
        hash: string;
        url_download: string;
        category: string;
        subcategoryId: string | null;
        subcategoryName: string | null;
    }>;
    deletePdf(id: string): Promise<{
        message: string;
    }>;
}
