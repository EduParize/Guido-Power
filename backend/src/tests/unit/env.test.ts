import { loadEnv } from "../../configuration/env-constants/env";

const MONGO_URI = "mongodb://localhost:27017/test";

const zenvia = {
  ZENVIA_API_URL: "https://api.zenvia.com/v2",
  ZENVIA_API_TOKEN: "token-ficticio",
  ZENVIA_WHATSAPP_FROM: "5500000000000",
};

describe("loadEnv", () => {
  it("usa a porta padrão quando PORT não é informado", () => {
    expect(loadEnv({ MONGO_URI, ...zenvia })).toEqual({
      PORT: 3000,
      MONGO_URI,
      ...zenvia,
    });
  });

  it("falha sem MONGO_URI", () => {
    expect(() => loadEnv({ PORT: "3000", ...zenvia })).toThrow("MONGO_URI is required");
  });

  it("falha sem ZENVIA_API_TOKEN", () => {
    expect(() => loadEnv({
      PORT: "3000",
      MONGO_URI,
      ZENVIA_API_URL: zenvia.ZENVIA_API_URL,
      ZENVIA_WHATSAPP_FROM: zenvia.ZENVIA_WHATSAPP_FROM,
    })).toThrow("ZENVIA_API_TOKEN is required");
  });

  it("falha com PORT inválido", () => {
    expect(() => loadEnv({ PORT: "abc", MONGO_URI, ...zenvia })).toThrow("PORT must be a positive integer");
  });
});
