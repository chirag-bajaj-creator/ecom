import { useEffect, useRef } from 'react';

const useCatalogUpdates = (onUpdate) => {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const callbackRef = useRef(onUpdate);

  // Keep callback ref fresh
  callbackRef.current = onUpdate;

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      const apiUrl = import.meta.env.VITE_API_URL || '';
      let wsBase;
      if (apiUrl) {
        wsBase = apiUrl.replace(/\/api\/v1$/, '').replace(/^http/, 'ws');
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsBase = `${protocol}//${window.location.host}`;
      }

      const ws = new WebSocket(`${wsBase}/ws?type=browse`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'catalog_update') {
            callbackRef.current();
          }
        } catch (err) {
          // ignore non-json messages
        }
      };

      ws.onclose = () => {
        if (isMounted) {
          reconnectTimer.current = setTimeout(connect, 5000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
};

export default useCatalogUpdates;
