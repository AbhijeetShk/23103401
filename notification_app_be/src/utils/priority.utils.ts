import type { Notification } from "../types/notification.types.js";

export const getPriority = (notification: Notification) => {
  let score = 0;

  const typeWeights: Record<string, number> = {
    Placement: 100,
    Result: 70,
    Event: 50,
  };

  score += typeWeights[notification.Type] || 0;

  const message = notification.Message.toLowerCase();

  if (message.includes("hiring")) {
    score += 25;
  }

  if (message.includes("review")) {
    score += 15;
  }

  if (message.includes("placement")) {
    score += 20;
  }

  const createdTime = new Date(notification.Timestamp).getTime();

  const currentTime = Date.now();

  const hoursOld =
    (currentTime - createdTime) / (1000 * 60 * 60);

  score -= hoursOld;

  return score;
};