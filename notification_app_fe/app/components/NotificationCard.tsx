type Props = {
  title: string;
  message: string;
  read: boolean;
};

const NotificationCard = ({ title, message, read }: Props) => {
  return (
    <div
      className={`border rounded p-4 mb-4 ${
        read ? "bg-gray-100" : "bg-white"
      }`}
    >
      <h2 className="font-semibold text-lg">{title}</h2>
      <p className="text-sm mt-2">{message}</p>

      <p className="mt-2 text-xs">
        {read ? "Read" : "Unread"}
      </p>
    </div>
  );
};

export default NotificationCard;