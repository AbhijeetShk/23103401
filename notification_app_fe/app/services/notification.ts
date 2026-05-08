import axios from "axios";

const BASE_URL = "http://4.224.186.213/evaluation-service";

export const fetchNotifications = async (
  type: string,
  page: number
) => {
  const response = await axios.get(`${BASE_URL}/notifications`, {
    params: {
      notification_type: type,
      page,
      limit: 10,
    },
  });

  return response.data;
};