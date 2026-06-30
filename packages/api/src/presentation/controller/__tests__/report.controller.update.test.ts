import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { UpdateReportController } from '../report/update-report.controller';
import { UpdateReportUseCase } from '@application/usecase/report-usecase/update-report.usecase';
import { ReportNotFoundError } from '@domain/errors/ReportNotFoundError';
import { UnauthorizedReportEditError } from '@domain/errors/UnauthorizedReportEditError';
import { InvalidFieldError } from '@application/errors/errors';
import { invoke } from './test-helpers';

const buildRes = (): Partial<Response> => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
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

describe('UpdateReportController', () => {
  let updateReportUseCase: UpdateReportUseCase;
  let controller: UpdateReportController;

  beforeEach(() => {
    updateReportUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as UpdateReportUseCase;

    controller = new UpdateReportController(updateReportUseCase);
  });

  it('retorna 204 cuando la actualización es exitosa', async () => {
    const req = buildUpdateReq(validUpdateBody, REPORT_ID);
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(204);
    expect(updateReportUseCase.execute).toHaveBeenCalledOnce();
  });

  it('pasa publicId y body al usecase', async () => {
    const req = buildUpdateReq(validUpdateBody, REPORT_ID);
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(updateReportUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ publicId: REPORT_ID, ...validUpdateBody }),
      'user-public-id',
    );
  });

  it('pasa los buffers de los archivos como newImages', async () => {
    const fakeFile = { buffer: Buffer.from('img') } as Express.Multer.File;
    const req = buildUpdateReq(validUpdateBody, REPORT_ID, [fakeFile]);
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(updateReportUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ newImages: [fakeFile.buffer] }),
      'user-public-id',
    );
  });

  it('lanza UserNotFoundError (404) si no hay usuario autenticado', async () => {
    const req: Partial<Request> = {
      validated: { body: validUpdateBody, params: { publicId: REPORT_ID } },
      files: [],
      auth: undefined,
      originalUrl: '/api/reports',
      method: 'PATCH',
    };
    const res = buildRes();

    await invoke(controller.handle, req, res);

    // New controllers throw UserNotFoundError (404) instead of returning 401
    expect(res.status).toHaveBeenCalledWith(404);
    expect(updateReportUseCase.execute).not.toHaveBeenCalled();
  });

  it('retorna 404 si el reporte no existe', async () => {
    const err = new ReportNotFoundError(REPORT_ID);
    vi.mocked(updateReportUseCase.execute).mockRejectedValue(err);

    const req = buildUpdateReq(validUpdateBody, REPORT_ID);
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('retorna 403 si el usuario no es el dueño del reporte', async () => {
    const err = new UnauthorizedReportEditError();
    vi.mocked(updateReportUseCase.execute).mockRejectedValue(err);

    const req = buildUpdateReq(validUpdateBody, REPORT_ID);
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('retorna 400 si hay un campo inválido', async () => {
    const err = new InvalidFieldError('occurredAt', 'cannot be in the future');
    vi.mocked(updateReportUseCase.execute).mockRejectedValue(err);

    const req = buildUpdateReq(validUpdateBody, REPORT_ID);
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('retorna 500 si ocurre un error inesperado', async () => {
    vi.mocked(updateReportUseCase.execute).mockRejectedValue(new Error('DB crash'));

    const req = buildUpdateReq(validUpdateBody, REPORT_ID);
    const res = buildRes();

    await invoke(controller.handle, req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});