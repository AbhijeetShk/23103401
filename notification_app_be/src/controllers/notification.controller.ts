import type { Request, Response } from "express";
import { fetchNotifications } from "../services/notification.service.js";
import { getPriority } from "../utils/priority.utils.js";


export const getNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    const notifications = await fetchNotifications();

    const sortedNotifications = notifications
      .map((notification) => ({
        ...notification,
        priority: getPriority(notification),
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      count: sortedNotifications.length,
      notifications: sortedNotifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};