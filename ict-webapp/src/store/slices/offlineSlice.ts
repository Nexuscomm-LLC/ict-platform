import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { OfflineAction } from '../../types';

interface OfflineState {
  actions: OfflineAction[];
  isSyncing: boolean;
  lastSyncAt: string | null;
  syncError: string | null;
}

const STORAGE_KEY = 'ict_offline_actions';

const loadFromStorage = (): OfflineAction[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (actions: OfflineAction[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
};

const initialState: OfflineState = {
  actions: loadFromStorage(),
  isSyncing: false,
  lastSyncAt: null,
  syncError: null,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    addAction: (state, action: PayloadAction<Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retries'>>) => {
      const newAction: OfflineAction = {
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        synced: false,
        retries: 0,
      };
      state.actions.push(newAction);
      saveToStorage(state.actions);
    },
    markSynced: (state, action: PayloadAction<string>) => {
      const idx = state.actions.findIndex(a => a.id === action.payload);
      if (idx !== -1) {
        state.actions[idx].synced = true;
      }
      // Remove synced actions
      state.actions = state.actions.filter(a => !a.synced);
      saveToStorage(state.actions);
    },
    incrementRetry: (state, action: PayloadAction<string>) => {
      const idx = state.actions.findIndex(a => a.id === action.payload);
      if (idx !== -1) {
        state.actions[idx].retries += 1;
      }
      saveToStorage(state.actions);
    },
    removeAction: (state, action: PayloadAction<string>) => {
      state.actions = state.actions.filter(a => a.id !== action.payload);
      saveToStorage(state.actions);
    },
    clearSynced: (state) => {
      state.actions = state.actions.filter(a => !a.synced);
      saveToStorage(state.actions);
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.syncError = action.payload;
    },
    setLastSyncAt: (state, action: PayloadAction<string>) => {
      state.lastSyncAt = action.payload;
    },
  },
});

export const {
  addAction,
  markSynced,
  incrementRetry,
  removeAction,
  clearSynced,
  setSyncing,
  setSyncError,
  setLastSyncAt,
} = offlineSlice.actions;

export default offlineSlice.reducer;
