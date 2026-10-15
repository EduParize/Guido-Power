import { loadEnv } from "../../configuration/env-constants/env";

const MONGO_URI = "mongodb://localhost:27017/test";

describe("loadEnv", () => {
  it("usa a porta padrão quando PORT não é informado", () => {
    expect(loadEnv({ MONGO_URI })).toEqual({ PORT: 3000, MONGO_URI });
  });

  it("falha sem MONGO_URI", () => {
    expect(() => loadEnv({ PORT: "3000" })).toThrow("MONGO_URI is required");
  });

  it("falha com PORT inválido", () => {
    expect(() => loadEnv({ PORT: "abc", MONGO_URI })).toThrow("PORT must be a positive integer");
  });
});
