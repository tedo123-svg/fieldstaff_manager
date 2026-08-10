import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Notification } from '../types';
import { NOTIFICATIONS } from '../data/mockData';

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
}

const initialState: NotificationsState = {
  items: NOTIFICATIONS,
  unreadCount: NOTIFICATIONS.filter(n => !n.isRead).length,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload);
      if (!action.payload.isRead) state.unreadCount++;
    },
    markRead(state, action: PayloadAction<string>) {
      const n = state.items.find(i => i.id === action.payload);
      if (n && !n.isRead) { n.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
    },
    markAllRead(state) {
      state.items.forEach(n => { n.isRead = true; });
      state.unreadCount = 0;
    },
  },
});

export const { addNotification, markRead, markAllRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
