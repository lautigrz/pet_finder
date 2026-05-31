import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("@infrastructure/storage/CloudinaryConfig", () => ({
    cloudinary: {
        uploader: {
            upload_stream: vi.fn(),
            destroy: vi.fn(),
        },
        config: vi.fn(),
    },
}));

vi.mock("@infrastructure/prisma/prisma.client", () => ({
    default: {
        pet: {
            create: vi.fn().mockResolvedValue({}),
            findMany: vi.fn().mockResolvedValue([
                { id: "1", name: "Fluffy" },
                { id: "2", name: "Spot" },
            ]),
        },
    },
}));

vi.mock("@infrastructure/queue/embedding.queue", () => ({
    enqueueMatchingJob: vi.fn().mockResolvedValue({}),
}));

import app from "../../../app";

describe("GET /health", () => {
    it("debe retornar status 200 y ok", async () => {
        const res = await request(app).get("/api/health");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
        expect(res.body).toHaveProperty("uptime");
        expect(res.body).toHaveProperty("timestamp");
    });
});