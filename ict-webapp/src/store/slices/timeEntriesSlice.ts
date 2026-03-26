import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { TimeEntry } from '../../types';
import { api } from '../../services/api';

interface TimeEntriesState {
  entries: TimeEntry[];
  activeEntry: TimeEntry | null;
  isLoading: boolean;
  error: string | null;
  timer: {
    isRunning: boolean;
    startTime: string | null;
    elapsed: number;
    breakMinutes: number;
    isOnBreak: boolean;
  };
}

const initialState: TimeEntriesState = {
  entries: [],
  activeEntry: null,
  isLoading: false,
  error: null,
  timer: {
    isRunning: false,
    startTime: null,
    elapsed: 0,
    breakMinutes: 0,
    isOnBreak: false,
  },
};

export const fetchTimeEntries = createAsyncThunk(
  'timeEntries/fetchTimeEntries',
  async (params?: { date?: string; project_id?: number }) => {
    const response = await api.get('/time-entries', { params });
    return response.data;
  }
);

export const clockIn = createAsyncThunk(
  'timeEntries/clockIn',
  async (data: { project_id?: number; notes?: string; latitude?: number; longitude?: number }) => {
    const response = await api.post('/time-entries/clock-in', data);
    return response.data;
  }
);

export const clockOut = createAsyncThunk(
  'timeEntries/clockOut',
  async (data: { notes?: string; latitude?: number; longitude?: number }) => {
    const response = await api.post('/time-entries/clock-out', data);
    return response.data;
  }
);

export const updateTimeEntry = createAsyncThunk(
  'timeEntries/updateTimeEntry',
  async ({ id, data }: { id: number; data: Partial<TimeEntry> }) => {
    const response = await api.put(`/time-entries/${id}`, data);
    return response.data;
  }
);

const timeEntriesSlice = createSlice({
  name: 'timeEntries',
  initialState,
  reducers: {
    updateElapsed: (state, action: PayloadAction<number>) => {
      state.timer.elapsed = action.payload;
    },
    startBreak: (state) => {
      state.timer.isOnBreak = true;
    },
    endBreak: (state, action: PayloadAction<number>) => {
      state.timer.isOnBreak = false;
      state.timer.breakMinutes += action.payload;
    },
    resetTimer: (state) => {
      state.timer = initialState.timer;
      state.activeEntry = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimeEntries.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTimeEntries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.entries = action.payload;
        // Check for active entry
        const active = action.payload.find((e: TimeEntry) => e.status === 'active');
        if (active) {
          state.activeEntry = active;
          state.timer.isRunning = true;
          state.timer.startTime = active.clock_in;
        }
      })
      .addCase(fetchTimeEntries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch time entries';
      })
      .addCase(clockIn.fulfilled, (state, action) => {
        state.activeEntry = action.payload;
        state.timer.isRunning = true;
        state.timer.startTime = action.payload.clock_in;
        state.timer.elapsed = 0;
        state.timer.breakMinutes = 0;
        state.entries.unshift(action.payload);
      })
      .addCase(clockOut.fulfilled, (state, action) => {
        state.activeEntry = null;
        state.timer = initialState.timer;
        const index = state.entries.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.entries[index] = action.payload;
        }
      });
  },
});

export const { updateElapsed, startBreak, endBreak, resetTimer } = timeEntriesSlice.actions;
export default timeEntriesSlice.reducer;
