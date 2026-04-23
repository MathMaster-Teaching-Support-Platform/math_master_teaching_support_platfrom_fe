import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';
import { AuthService } from '../services/api/auth.service';
import type { Notification } from '../types/notification';
import { pushNotificationService } from '../services/push-notification.service';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loadMore: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

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

  // Fetch notifications list with infinite query
  const {
    data: notifsData,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    queryFn: ({ pageParam = 0 }) => notificationService.getNotifications(pageParam, 20),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.number < lastPage.totalPages - 1) {
        return lastPage.number + 1;
      }
      return undefined;
    },
    enabled: isAuthenticated,
  });

  const notifications = useMemo(() => {
    return notifsData?.pages.flatMap(page => page.content) || [];
  }, [notifsData]);
  const unreadCount = unreadData?.unreadCount ?? unreadData?.count ?? 0;

  const applyIncomingNotification = (rawPayload: Record<string, unknown>) => {
    const newNotif: Notification = {
      id: (rawPayload.id as string) || String(Date.now()),
      type: (rawPayload.type as string) || 'system',
      title: (rawPayload.title as string) || 'Notification',
      content: (rawPayload.content as string) || '',
      read: false,
      createdAt:
        (rawPayload.createdAt as string) ||
        (rawPayload.timestamp as string) ||
        new Date().toISOString(),
      metadata: rawPayload.metadata as Record<string, unknown> | undefined,
    };

    queryClient.setQueryData<{ unreadCount?: number; count?: number }>(
      ['notifications', 'unreadCount'],
      (old) => {
        const current = old?.unreadCount ?? old?.count ?? 0;
        return { unreadCount: current + 1 };
      }
    );

    queryClient.setQueryData<any>(
      ['notifications', 'list'],
      (oldData) => {
        if (!oldData) return { pages: [{ content: [newNotif] }], pageParams: [0] };
        
        const firstPage = oldData.pages[0];
        if (!firstPage) return { pages: [{ content: [newNotif] }], pageParams: [0] };
        
        const exists = firstPage.content.find((n: Notification) => n.id === newNotif.id);
        if (exists) return oldData;
        
        return {
          ...oldData,
          pages: [
            { ...firstPage, content: [newNotif, ...firstPage.content] },
            ...oldData.pages.slice(1),
          ],
        };
      }
    );
  };

  useEffect(() => {
    if (!isAuthenticated) {
      void pushNotificationService.unregisterToken();
      return;
    }

    let unsubscribeForeground: (() => void) | null = null;
    let unsubscribeSw: (() => void) | null = null;

    void (async () => {
      try {
        await pushNotificationService.initAndRegisterToken();
      } catch (error) {
        console.error('[FCM] Failed to initialize push notification token:', error);
      }

      unsubscribeForeground = await pushNotificationService.subscribeForeground((payload) => {
        applyIncomingNotification(payload);
      });

      unsubscribeSw = pushNotificationService.subscribeServiceWorker((payload) => {
        applyIncomingNotification(payload);
      });
    })();

    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
      if (unsubscribeSw) unsubscribeSw();
    };
  }, [isAuthenticated, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      
      const prevList = queryClient.getQueryData<any>(['notifications', 'list']);
      const prevCount = queryClient.getQueryData<{ unreadCount?: number; count?: number }>([
        'notifications',
        'unreadCount',
      ]);
      
      // Optimistic update
      queryClient.setQueryData<any>(['notifications', 'list'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.map((n: Notification) => n.id === id ? { ...n, read: true } : n),
          })),
        };
      });
      
      queryClient.setQueryData<{ unreadCount?: number; count?: number }>(
        ['notifications', 'unreadCount'],
        (old) => {
          const current = old?.unreadCount ?? old?.count ?? 0;
          if (current === 0) return old;
          const item = prevList?.pages?.[0]?.content?.find((n: Notification) => n.id === id);
          return { unreadCount: Math.max(0, current - (item && !item.read ? 1 : 0)) };
        }
      );

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
      const prevList = queryClient.getQueryData<any>(['notifications', 'list']);
      const prevCount = queryClient.getQueryData<{ unreadCount?: number; count?: number }>([
        'notifications',
        'unreadCount',
      ]);

      queryClient.setQueryData<{ unreadCount?: number; count?: number }>(['notifications', 'unreadCount'], {
        unreadCount: 0,
      });
      queryClient.setQueryData<any>(['notifications', 'list'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.map((n: Notification) => ({ ...n, read: true })),
          })),
        };
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
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    markAsRead: async (id: string) => { await markAsReadMutation.mutateAsync(id); },
    markAllAsRead: async () => { await markAllAsReadMutation.mutateAsync(); },
    loadMore: () => { if (hasNextPage) fetchNextPage(); },
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
