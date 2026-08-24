import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';

/**
 * Global listener: when a medicine reminder notification is tapped,
 * deep-link into the quick "mark as given" sheet preselected for that medicine.
 */
export function NotificationDeepLinkHandler() {
  useEffect(() => {
    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string' && url.startsWith('/')) {
        router.push(url as Href);
      }
    }

    const initial = Notifications.getLastNotificationResponse();
    if (initial?.notification) {
      redirect(initial.notification);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
