import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { CreateReportController } from '../report.controller';
import { CreateReportUseCase } from '@application/usecase/report/create-report.usecase';
import { GetReportUseCase } from '@application/usecase/report/get-report-usecase';
import { ListUserReportsUseCase } from '@application/usecase/report/list-user-reports.usecase';
import { GetFilteredReportsUseCase } from '@application/usecase/report/get-filter-reports.usecase';
import { UpdateStatus } from '@application/usecase/report/update-status-report';
import { UpdateReportUseCase } from '@application/usecase/report/update-report.usecase';
import { ReportNotFoundError } from '@domain/errors/ReportNotFoundError';
import { UnauthorizedReportEditError } from '@domain/errors/UnauthorizedReportEditError';
import { InvalidFieldError } from '@application/errors/errors';


const buildRes = (): Partial<Response> => ({
  status: vi.fn().mockReturnThis(),
  json:   vi.fn().mockReturnThis(),
  sendStatus: vi.fn().mockReturnThis(),
});

const buildUpdateReq = (
  body: unknown,
  publicId: string,
  files: Express.Multer.File[] = [],
  sub = 'user-public-id',
): Partial<Request> => ({
  validated: { body, params: { publicId } },
  files,
  auth: { sub, email: 'test@mail.com', isVerified: true },
  originalUrl: `/api/reports/${publicId}`,
  method: 'PATCH',
});

const REPORT_ID = 'report-uuid-1';

const validUpdateBody = {
  description: 'Descripción actualizada',
  occurredAt: new Date('2024-05-01T10:00:00.000Z'),
};


describe('CreateReportController — update', () => {
  let updateReportUseCase: UpdateReportUseCase;
  let controller: CreateReportController;

  beforeEach(() => {
    updateReportUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as UpdateReportUseCase;

    controller = new CreateReportController(
      { execute: vi.fn() } as unknown as CreateReportUseCase,
      { execute: vi.fn() } as unknown as GetReportUseCase,
      { execute: vi.fn() } as unknown as ListUserReportsUseCase,
      { execute: vi.fn() } as unknown as GetFilteredReportsUseCase,
      { execute: vi.fn() } as unknown as UpdateStatus,
      updateReportUseCase,
    );
  });


  it('retorna 204 cuando la actualización es exitosa', async () => {
    const req = buildUpdateReq(validUpdateBody, REPORT_ID);
    const res = buildRes();

    await controller.update(req as Request, res as Response);

    expect(res.sendStatus).toHaveBeenCalledWith(204);
    expect(updateReportUseCase.execute).toHaveBeenCalledOnce();
  });

  it('pasa publicId y body al usecase', async () => {
    const req = buildUpdateReq(validUpdateBody, REPORT_ID);
    const res = buildRes();

    await controller.update(req as Request, res as Response);

    expect(updateReportUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ publicId: REPORT_ID, ...validUpdateBody }),
      'user-public-id',
    );
  });

  it('pasa los buffers de los archivos como newImages', async () => {
    const fakeFile = { buffer: Buffer.from('img') } as Express.Multer.File;
    const req = buildUpdateReq(validUpdateBody, REPORT_ID, [fakeFile]);
    const res = buildRes();

    await controller.update(req as Request, res as Response);

    expect(updateReportUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ newImages: [fakeFile.buffer] }),
      'user-public-id',
    );
  });


  it('retorna 401 si no hay usuario autenticado', async () => {
    const req: Partial<Request> = {
      validated: { body: validUpdateBody, params: { publicId: REPORT_ID } },
      files: [],
      auth: undefined,
      originalUrl: '/api/reports',
      method: 'PATCH',
    };
    const res = buildRes();

    await controller.update(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(updateReportUseCase.execute).not.toHaveBeenCalled();
  });


  it('retorna 404 si el reporte no existe', async () => {
    const err = new ReportNotFoundError(REPORT_ID);
    vi.mocked(updateReportUseCase.execute).mockRejectedValue(err);

    const req = buildUpdateReq(validUpdateBody, REPORT_ID);
    const res = buildRes();

    await controller.update(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: err.message });
  });

  it('retorna 403 si el usuario no es el dueño del reporte', async () => {
    const err = new UnauthorizedReportEditError();
    vi.mocked(updateReportUseCase.execute).mockRejectedValue(err);

    const req = buildUpdateReq(validUpdateBody, REPORT_ID);
    const res = buildRes();

    await controller.update(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: err.message });
  });

  it('retorna 400 si hay un campo inválido', async () => {
    const err = new InvalidFieldError('occurredAt', 'cannot be in the future');
    vi.mocked(updateReportUseCase.execute).mockRejectedValue(err);

    const req = buildUpdateReq(validUpdateBody, REPORT_ID);
    const res = buildRes();

    await controller.update(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: err.message });
  });

  it('retorna 500 si ocurre un error inesperado', async () => {
    vi.mocked(updateReportUseCase.execute).mockRejectedValue(new Error('DB crash'));

    const req = buildUpdateReq(validUpdateBody, REPORT_ID);
    const res = buildRes();

    await controller.update(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
