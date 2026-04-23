import { useEffect } from 'react';
import { router } from '../../routes/AppRouter';

const ServiceWorkerNavigationHandler: React.FC = () => {
  useEffect(() => {
    // Listen for navigation messages from service worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'navigate' && event.data?.url) {
        router.navigate(event.data.url);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, []);

  return null; // This component doesn't render anything
};

export default ServiceWorkerNavigationHandler;