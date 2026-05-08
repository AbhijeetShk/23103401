import axios from "axios";
import type { Notification } from "../types/notification.types.js";

export const fetchNotifications = async () => {
  const token = process.env.EVALUATION_SERVICE_BEARER_TOKEN;

  if (!token) {
    throw new Error("Missing EVALUATION_SERVICE_BEARER_TOKEN environment variable");
  }

  const response = await axios.get(
    "http://4.224.186.213/evaluation-service/notifications",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.notifications as Notification[];
};