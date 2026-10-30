export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'project_manager' | 'technician' | 'inventory_manager';
  avatar?: string;
}

export interface Project {
  id: number;
  project_number: string;
  name: string;
  client_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  start_date: string;
  end_date?: string;
  budget?: number;
  spent?: number;
  progress: number;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: number;
  user_id: number;
  project_id?: number;
  clock_in: string;
  clock_out?: string;
  break_minutes: number;
  notes?: string;
  status: 'active' | 'completed' | 'pending_approval';
  hourly_rate?: number;
  overtime_rate?: number;
  latitude_in?: number;
  longitude_in?: number;
  latitude_out?: number;
  longitude_out?: number;
  synced: boolean;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  min_quantity: number;
  unit_price: number;
  location?: string;
  barcode?: string;
  image_url?: string;
  last_restock?: string;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: number;
  name: string;
  serial_number: string;
  category: string;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  assigned_to?: number;
  assigned_project?: number;
  last_maintenance?: string;
  next_maintenance?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  notes?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  created_at: string;
}

export interface DashboardStats {
  activeProjects: number;
  completedThisMonth: number;
  totalHoursToday: number;
  pendingApprovals: number;
  lowStockItems: number;
  upcomingTasks: number;
}

export interface OfflineAction {
  id: string;
  type: 'time_entry' | 'inventory_update' | 'project_update';
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  timestamp: string;
  synced: boolean;
  retries: number;
}
