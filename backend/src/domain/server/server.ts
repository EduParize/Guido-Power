import "../../configuration/dotenv";
import { loadEnv } from "../../configuration/env-constants/env";
import { createApp } from "../../app";
import { connectMongo } from "../../infraestructure/db/mongo/connection";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  await connectMongo(env.MONGO_URI);

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
