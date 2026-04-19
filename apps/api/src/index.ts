import { env } from "./config/env.js";
import { buildServer } from "./server.js";

const start = async () => {
  const app = buildServer();

  const PORT = process.env.PORT
    ? Number(process.env.PORT)
    : env.API_PORT || 3000;

  const HOST = "0.0.0.0";

  try {
    await app.listen({
      host: HOST,
      port: PORT
    });

    console.log(`Server running on ${HOST}:${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
