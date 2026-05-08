"use client";
import { useEffect, useState } from "react";
import NotificationCard from "./NotificationCard";
import { fetchNotifications } from "../services/notification";

type Props = {
  type: string;
};

const NotificationList = ({ type }: Props) => {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    setLoading(true);

    try {
      const data = await fetchNotifications(type, page);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    getData();
  }, [type, page]);

  return (
    <div className="p-4">
      {loading && <p>Loading...</p>}

      {!loading &&
        notifications.map((item: any, index: number) => (
          <NotificationCard
            key={index}
            title={item.title}
            message={item.message}
            read={item.read}
          />
        ))}

      <div className="flex gap-4 mt-4">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="border px-4 py-2 rounded"
        >
          Prev
        </button>

        <button
          onClick={() => setPage(page + 1)}
          className="border px-4 py-2 rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default NotificationList;