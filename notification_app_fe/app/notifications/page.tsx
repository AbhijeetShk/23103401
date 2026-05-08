// import NotificationList from "./components/NotificationList";

import NotificationList from "../components/NotificationList";

type Props = {
  searchParams: {
    type?: string;
  };
};

export default function NotificationsPage({
  searchParams,
}: Props) {
  const type = searchParams.type || "";

  return <NotificationList type={type} />;
}