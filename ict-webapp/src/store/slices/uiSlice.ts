import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface Modal {
  isOpen: boolean;
  type: string | null;
  data?: Record<string, unknown>;
}

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  toasts: Toast[];
  modal: Modal;
  globalSearch: {
    isOpen: boolean;
    query: string;
  };
  isOnline: boolean;
}

const getInitialTheme = (): 'light' | 'dark' | 'system' => {
  const stored = localStorage.getItem('ict_theme');
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
};

const initialState: UIState = {
  theme: getInitialTheme(),
  sidebarOpen: true,
  toasts: [],
  modal: { isOpen: false, type: null },
  globalSearch: { isOpen: false, query: '' },
  isOnline: navigator.onLine,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
      localStorage.setItem('ict_theme', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      state.toasts.push({
        ...action.payload,
        id: Date.now().toString(),
      });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    openModal: (state, action: PayloadAction<{ type: string; data?: Record<string, unknown> }>) => {
      state.modal = { isOpen: true, ...action.payload };
    },
    closeModal: (state) => {
      state.modal = { isOpen: false, type: null };
    },
    toggleGlobalSearch: (state) => {
      state.globalSearch.isOpen = !state.globalSearch.isOpen;
      if (!state.globalSearch.isOpen) {
        state.globalSearch.query = '';
      }
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.globalSearch.query = action.payload;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  addToast,
  removeToast,
  openModal,
  closeModal,
  toggleGlobalSearch,
  setSearchQuery,
  setOnlineStatus,
} = uiSlice.actions;

export default uiSlice.reducer;
