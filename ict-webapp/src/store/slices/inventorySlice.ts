import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { InventoryItem } from '../../types';
import { api } from '../../services/api';

interface InventoryState {
  items: InventoryItem[];
  selectedItem: InventoryItem | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    category: string | null;
    search: string;
    lowStock: boolean;
  };
}

const initialState: InventoryState = {
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,
  filters: {
    category: null,
    search: '',
    lowStock: false,
  },
};

export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (params?: { category?: string; search?: string; low_stock?: boolean }) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  }
);

export const fetchInventoryItem = createAsyncThunk(
  'inventory/fetchItem',
  async (id: number) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  }
);

export const lookupBarcode = createAsyncThunk(
  'inventory/lookupBarcode',
  async (barcode: string) => {
    const response = await api.get(`/inventory/barcode/${barcode}`);
    return response.data;
  }
);

export const updateQuantity = createAsyncThunk(
  'inventory/updateQuantity',
  async ({ id, quantity, reason }: { id: number; quantity: number; reason?: string }) => {
    const response = await api.patch(`/inventory/${id}/quantity`, { quantity, reason });
    return response.data;
  }
);

export const createInventoryItem = createAsyncThunk(
  'inventory/createItem',
  async (data: Partial<InventoryItem>) => {
    const response = await api.post('/inventory', data);
    return response.data;
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<InventoryState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch inventory';
      })
      .addCase(fetchInventoryItem.fulfilled, (state, action) => {
        state.selectedItem = action.payload;
      })
      .addCase(lookupBarcode.fulfilled, (state, action) => {
        state.selectedItem = action.payload;
      })
      .addCase(updateQuantity.fulfilled, (state, action) => {
        const index = state.items.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedItem?.id === action.payload.id) {
          state.selectedItem = action.payload;
        }
      })
      .addCase(createInventoryItem.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });
  },
});

export const { setFilters, clearSelectedItem } = inventorySlice.actions;
export default inventorySlice.reducer;
