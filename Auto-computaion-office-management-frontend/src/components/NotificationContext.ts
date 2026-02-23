import { createContext } from "react";

export type NotificationType = "success" | "error";

export interface NotificationItem {
  id: number;
  type: NotificationType;
  message: string;
}

export interface NotificationContextProps {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

export const NotificationContext = createContext<NotificationContextProps>(
  {} as NotificationContextProps,
);
