import express from "express";
import cors from "cors";

import notificationRoutes from "./routes/notification.routes.js";

const app = express();

app.use(cors());

app.use(express.json());

app.use("/notifications", notificationRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//GET http://localhost:3000/notifications