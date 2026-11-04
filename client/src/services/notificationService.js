import api from './api';

const MOCK_NOTIFS = [
  {
    _id: 'n-1',
    title: 'Batch BATCH-2026-1004 Quarantined',
    message: 'Batch BATCH-2026-1004 placed in QUARANTINE due to Histamine non-compliance.',
    type: 'danger',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'n-2',
    title: 'COA Issued: COA-2026-00101',
    message: 'Official Certificate of Analysis has been issued for Batch BATCH-2026-1001.',
    type: 'success',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const notificationService = {
  getNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[NotificationService] Falling back to mock notifications:', err.message);
    }
    return {
      success: true,
      data: MOCK_NOTIFS,
      unreadCount: MOCK_NOTIFS.filter((n) => !n.isRead).length,
    };
  },

  markAsRead: async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      return res.data;
    } catch (err) {
      const item = MOCK_NOTIFS.find((n) => n._id === id);
      if (item) item.isRead = true;
      return { success: true };
    }
  },

  markAllAsRead: async () => {
    try {
      const res = await api.post('/notifications/mark-all-read');
      return res.data;
    } catch (err) {
      MOCK_NOTIFS.forEach((n) => (n.isRead = true));
      return { success: true };
    }
  },
};
