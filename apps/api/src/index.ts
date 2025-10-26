import express, { type Request, type Response } from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// simple health route (proxy will be /api/health)
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, msg: "hello from CI (TS build)" });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log("API listening on :" + PORT);
});
