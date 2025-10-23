import express from "express";
import cors from "cors";
import {
  db_close_connection,
  db_connection,
} from "./src/database/db_connection.js";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";
import { HOST, PORT } from "./src/config/config.js";

// Para ver si responde la api
export const app = express();
app.get("/", (req, res) => {
  res.send("Connected Databases");
});
//corsOptions
// Middleware de app.js
app.use(helmet());
app.use(cors()); // hay que definirlo 
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Ruta
app.use("/" /*Nombre de la ruta del get*/);

// Configuracion de la base de datos
const inializeApp = async () => {
  try {
    await db_connection();
    console.log("✅ Connected successfully");
  } catch (error) {
    console.error("❌ Connection not successfully");
  } finally { // me dice que no porque la cierra al instante. Que dej la API sin DB
    await db_close_connection();
    console.log("Finished");
  }
};

// Guard de Content-Type para requests con body
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type debe ser application/json' });
  }
  next();
});

// arranque del app

let server;
if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, HOST, () => {
    console.log(`Server on http://${HOST}:${PORT}/`);
  });
}

// Exports (para testing)
export default app;
export { server };
