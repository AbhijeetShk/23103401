import express from "express";
import cors from "cors";

import notificationRoutes from "./routes/notification.routes.js";
import { log } from "../../logging_middleware/index.ts";

const app = express();

app.use(cors());

app.use(express.json());

app.use("/notifications", notificationRoutes);

const PORT = 3000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await log("backend", "info", "service", `Backend started on port ${PORT}`);
});

//GET http://localhost:3000/notifications