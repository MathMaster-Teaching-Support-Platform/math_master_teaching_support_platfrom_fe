import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Centrifuge } from 'centrifuge';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';
import { AuthService } from '../services/api/auth.service';
import type { Notification } from '../types/notification';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [, setCentrifuge] = useState<Centrifuge | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(AuthService.isAuthenticated());

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(AuthService.isAuthenticated());
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  // Fetch initial unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isAuthenticated,
  });

  // Fetch notifications list
  const { data: notifsData, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationService.getNotifications(0, 50),
    enabled: isAuthenticated,
  });

  const notifications = useMemo(() => notifsData?.content || [], [notifsData]);
  const unreadCount = unreadData?.count || 0;

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = AuthService.getToken();
    if (!token) return;
    
    const decoded = AuthService.decodeToken(token);
    const userId = decoded?.sub;

    if (!userId) return;

    // Initialize Centrifugo
    const wsUrl = import.meta.env.VITE_CENTRIFUGO_WS_URL || 'ws://localhost:8000/connection/websocket';
    const centrifugeInstance = new Centrifuge(wsUrl, {
      getToken: async () => {
        try {
          const res = await notificationService.getConnectionToken();
          console.log('[Centrifugo] Token fetched successfully, sub length:', res.token?.length);
          return res.token;
        } catch (error) {
          console.error('[Centrifugo] Failed to get centrifugo token:', error);
          throw error; // Throw instead of returning '' so Centrifuge retries properly
        }
      },
    });

    centrifugeInstance.on('connected', (ctx) => {
      console.log('[Centrifugo] Connected! client:', ctx.client);
    });

    centrifugeInstance.on('disconnected', (ctx) => {
      console.warn('[Centrifugo] Disconnected:', ctx.reason, 'code:', ctx.code);
    });

    centrifugeInstance.on('error', (ctx) => {
      console.error('[Centrifugo] Error:', ctx.error);
    });

    // Subscriptions
    const channels = [`notifications:public`, `notifications:all`, `notifications:user:${userId}`];
    
    channels.forEach((channel) => {
      const sub = centrifugeInstance.newSubscription(channel);
      
      sub.on('publication', (ctx) => {
        console.log('[Centrifugo] Publication received on channel:', channel, ctx.data);

        // Map NotificationRequest fields to Notification interface fields
        // Backend sends: { id, type, title, content, timestamp, recipientId, senderId, metadata }
        // Frontend needs: { id, type, title, content, read, createdAt, metadata }
        const raw = ctx.data as Record<string, unknown>;
        const newNotif: Notification = {
          id: (raw.id as string) || String(Date.now()),
          type: raw.type as string,
          title: raw.title as string,
          content: raw.content as string,
          read: false,
          createdAt: (raw.createdAt as string) || (raw.timestamp as string) || new Date().toISOString(),
          metadata: raw.metadata as Record<string, unknown> | undefined,
        };

        // Update unread count
        queryClient.setQueryData<{ count: number }>(['notifications', 'unreadCount'], (old) => {
          return { count: (old?.count || 0) + 1 };
        });

        // Update list
        queryClient.setQueryData<{ content: Notification[] } | undefined>(['notifications', 'list'], (oldData) => {
          if (!oldData) return { content: [newNotif] };
          const exists = oldData.content.find((n) => n.id === newNotif.id);
          if (exists) return oldData;
          return {
            ...oldData,
            content: [newNotif, ...oldData.content],
          };
        });
      });

      sub.subscribe();
    });

    centrifugeInstance.connect();
    setCentrifuge(centrifugeInstance);

    return () => {
      centrifugeInstance.disconnect();
    };
  }, [isAuthenticated, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      
      const prevList = queryClient.getQueryData<{ content: Notification[] }>(['notifications', 'list']);
      const prevCount = queryClient.getQueryData<{ count: number }>(['notifications', 'unreadCount']);
      
      // Optimistic update
      queryClient.setQueryData<{ content: Notification[] }>(['notifications', 'list'], (old) => {
        if (!old) return old;
        return {
          ...old,
          content: old.content.map(n => n.id === id ? { ...n, read: true } : n),
        };
      });
      
      queryClient.setQueryData<{ count: number }>(['notifications', 'unreadCount'], (old) => {
        if (!old || old.count === 0) return old;
        const item = prevList?.content.find(n => n.id === id);
        return { count: Math.max(0, old.count - (item && !item.read ? 1 : 0)) };
      });

      return { prevList, prevCount, id };
    },
    onError: (_, __, context) => {
      if (context?.prevList) queryClient.setQueryData(['notifications', 'list'], context.prevList);
      if (context?.prevCount) queryClient.setQueryData(['notifications', 'unreadCount'], context.prevCount);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const prevList = queryClient.getQueryData<{ content: Notification[] }>(['notifications', 'list']);
      const prevCount = queryClient.getQueryData<{ count: number }>(['notifications', 'unreadCount']);

      queryClient.setQueryData<{ count: number }>(['notifications', 'unreadCount'], { count: 0 });
      queryClient.setQueryData<{ content: Notification[] }>(['notifications', 'list'], (old) => {
        if (!old) return old;
        return { ...old, content: old.content.map(n => ({ ...n, read: true })) };
      });

      return { prevList, prevCount };
    },
    onError: (_, __, context) => {
      if (context?.prevList) queryClient.setQueryData(['notifications', 'list'], context.prevList);
      if (context?.prevCount) queryClient.setQueryData(['notifications', 'unreadCount'], context.prevCount);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
    }
  });

  const value = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: async (id: string) => { await markAsReadMutation.mutateAsync(id); },
    markAllAsRead: async () => { await markAllAsReadMutation.mutateAsync(); },
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationsContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationsContext must be used within a NotificationProvider');
  }
  return context;
};
