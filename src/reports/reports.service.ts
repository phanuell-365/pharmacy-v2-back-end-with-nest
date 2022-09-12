import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class ReportsService {
  constructor(private readonly usersService: UsersService) {}

  buildPDF(
    dataCallback: { (chunk: any): boolean; (...args: any[]): void },
    endCallback: {
      (): Response<any, Record<string, any>>;
      (...args: any[]): void;
    },
  ) {
    const doc = new PDFDocument();

    doc.on('data', dataCallback);
    doc.on('end', endCallback);

    doc.font('Times-Roman').fontSize(25).text('Hello world', 100, 100);
    doc.end();
  }

  usersReport(res: Response) {
    const stream = res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment;filename=users-reports.pdf',
    });

    this.buildPDF(
      (chunk) => stream.write(chunk),
      () => stream.end(),
    );
  }
}
