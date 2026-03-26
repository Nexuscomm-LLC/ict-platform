import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Project } from '../../types';
import { api } from '../../services/api';

interface ProjectsState {
  items: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status: string | null;
    search: string;
  };
}

const initialState: ProjectsState = {
  items: [],
  selectedProject: null,
  isLoading: false,
  error: null,
  filters: {
    status: null,
    search: '',
  },
};

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params?: { status?: string; search?: string }) => {
    const response = await api.get('/projects', { params });
    return response.data;
  }
);

export const fetchProject = createAsyncThunk(
  'projects/fetchProject',
  async (id: number) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (data: Partial<Project>) => {
    const response = await api.post('/projects', data);
    return response.data;
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, data }: { id: number; data: Partial<Project> }) => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ProjectsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedProject: (state) => {
      state.selectedProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch projects';
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.selectedProject = action.payload;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedProject?.id === action.payload.id) {
          state.selectedProject = action.payload;
        }
      });
  },
});

export const { setFilters, clearSelectedProject } = projectsSlice.actions;
export default projectsSlice.reducer;
