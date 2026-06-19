import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { MatchResultsController } from "../match-results.controller";
import { GetMatchResultsUseCase } from "@application/usecase/match-results-usecase/get-match-results.usecase";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { invoke } from "./test-helpers";

const buildRes = (): Partial<Response> => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
});

const buildReq = (params: Record<string, string>): Partial<Request> => ({
    params,
    originalUrl: `/api/reports/${params.publicId}/match-results`,
    method: "GET",
    auth: {
        sub: "user-public-id",
        email: "test@mail.com",
        isVerified: true,
    },
});

const fakeMatchResults = [
    {
        publicId: "match-uuid-1",
        sourceReportPublicId: "source-report-uuid",
        score: 0.95,
        details: {
            publicId: "candidate-uuid-1",
            images: ["https://img.example.com/dog.jpg"],
            animalType: "DOG",
        },
    },
    {
        publicId: "match-uuid-2",
        sourceReportPublicId: "source-report-uuid",
        score: 0.75,
        details: {
            publicId: "candidate-uuid-2",
            images: [],
            animalType: "CAT",
        },
    },
];

let getMatchResultsUseCase: GetMatchResultsUseCase;
let controller: MatchResultsController;

beforeEach(() => {
    getMatchResultsUseCase = {
        execute: vi.fn().mockResolvedValue(fakeMatchResults),
    } as unknown as GetMatchResultsUseCase;

    controller = new MatchResultsController(getMatchResultsUseCase);
});


describe("MatchResultsController", () => {

    describe("getMatchResults — éxito", () => {
        it("retorna 200 con la lista de match results", async () => {
            const req = buildReq({ publicId: "source-report-uuid" });
            const res = buildRes();

            await invoke(controller.getMatchResults, req, res);

            expect(getMatchResultsUseCase.execute).toHaveBeenCalledWith("source-report-uuid");
            expect(res.json).toHaveBeenCalledWith(fakeMatchResults);
        });

        it("llama al use case con el publicId correcto del path param", async () => {
            const req = buildReq({ publicId: "my-specific-report-id" });
            const res = buildRes();

            await invoke(controller.getMatchResults, req, res);

            expect(getMatchResultsUseCase.execute).toHaveBeenCalledWith("my-specific-report-id");
        });

        it("retorna 200 con array vacío cuando no hay matches", async () => {
            vi.mocked(getMatchResultsUseCase.execute).mockResolvedValue([]);
            const req = buildReq({ publicId: "source-report-uuid" });
            const res = buildRes();

            await invoke(controller.getMatchResults, req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    describe("getMatchResults — reporte fuente no encontrado", () => {
        it("retorna 404 si el reporte fuente no existe", async () => {
            const notFoundErr = new ReportNotFoundError("unknown-id");
            vi.mocked(getMatchResultsUseCase.execute).mockRejectedValue(notFoundErr);

            const req = buildReq({ publicId: "unknown-id" });
            const res = buildRes();

            await invoke(controller.getMatchResults, req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ code: "REPORT_NOT_FOUND" })
            );
        });
    });


    describe("getMatchResults — error inesperado", () => {
        it("retorna 500 si ocurre un error no controlado", async () => {
            vi.mocked(getMatchResultsUseCase.execute).mockRejectedValue(
                new Error("Database connection lost")
            );

            const req = buildReq({ publicId: "source-report-uuid" });
            const res = buildRes();

            await invoke(controller.getMatchResults, req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
