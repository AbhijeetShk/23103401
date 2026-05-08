import axios from "axios";
import { log } from "../../../logging_middleware/index.js";

const BASE_URL = "http://4.224.186.213/evaluation-service";

export const fetchNotifications = async (
  type: string,
  page: number
) => {
  await log("frontend", "info", "api", `Fetching notifications for type=${type} page=${page}`);

  try {
    const response = await axios.get(`${BASE_URL}/notifications`, {
      params: {
        notification_type: type,
        page,
        limit: 10,
      },
    });

    return response.data;
  } catch (error) {
    await log(
      "frontend",
      "error",
      "api",
      `Frontend notification fetch failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
};