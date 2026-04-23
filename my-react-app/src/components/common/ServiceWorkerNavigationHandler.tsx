import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ServiceWorkerNavigationHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for navigation messages from service worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'navigate' && event.data?.url) {
        navigate(event.data.url);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, [navigate]);

  return null; // This component doesn't render anything
};

export default ServiceWorkerNavigationHandler;