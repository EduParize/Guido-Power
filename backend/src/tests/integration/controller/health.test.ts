import request from "supertest";
import { createApp } from "../../../app";

process.env.MONGO_URI ??= "mongodb://localhost:27017/test";
process.env.ZENVIA_API_URL ??= "https://api.zenvia.com/v2";
process.env.ZENVIA_API_TOKEN ??= "token-ficticio";
process.env.ZENVIA_WHATSAPP_FROM ??= "5500000000000";

describe("GET /api/health", () => {
  it("responde status ok", async () => {
    const response = await request(createApp()).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
