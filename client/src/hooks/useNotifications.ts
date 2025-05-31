/**
 * Hook for showing non-blocking notifications throughout the app
 */
import { useCallback } from "react";

export const useNotifications = () => {
  /**
   * Shows a non-blocking notification with the specified message
   * @param message Message to display
   * @param type Type of notification (info, success, error)
   * @param durationMs Duration in milliseconds
   * @returns The created notification element
   */
  const showNotification = useCallback(
    (
      message: string,
      type: "info" | "success" | "error" = "info",
      durationMs = 3000
    ) => {
      const alertDiv = document.createElement("div");
      alertDiv.style.position = "fixed";
      alertDiv.style.top = "50%";
      alertDiv.style.left = "50%";
      alertDiv.style.transform = "translate(-50%, -50%)";

      // Set color based on type
      let bgColor = "#4CAF50"; // green/success default
      if (type === "info") bgColor = "#2196F3"; // blue
      if (type === "error") bgColor = "#F44336"; // red

      alertDiv.style.backgroundColor = bgColor;
      alertDiv.style.color = "white";
      alertDiv.style.padding = "20px";
      alertDiv.style.borderRadius = "5px";
      alertDiv.style.zIndex = "1000";
      alertDiv.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
      alertDiv.textContent = message;
      document.body.appendChild(alertDiv);

      // Remove after duration
      setTimeout(() => {
        if (alertDiv.parentNode) {
          document.body.removeChild(alertDiv);
        }
      }, durationMs);

      return alertDiv;
    },
    []
  );

  return { showNotification };
};

export default useNotifications;
