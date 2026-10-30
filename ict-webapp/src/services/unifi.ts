import { api } from './api';

// Shapes mirror the UniFi console APIs (Network/Protect integration v1, Access developer v1),
// which the WordPress plugin proxies under /unifi.

export interface AppStatus {
  configured: boolean;
  reachable: boolean;
  version: string | null;
  error: string | null;
}

export interface UnifiStatus {
  network: AppStatus;
  protect: AppStatus;
  access: AppStatus;
}

export interface UnifiSettings {
  console_url: string;
  access_port: number;
  site_id: string;
  verify_ssl: boolean;
  has_api_key: boolean;
  has_access_token: boolean;
}

export interface UnifiSettingsInput {
  console_url?: string;
  api_key?: string;
  access_token?: string;
  access_port?: number;
  site_id?: string;
  verify_ssl?: boolean;
}

export interface NetworkSite {
  id: string;
  name: string;
}

export interface DevicePort {
  idx: number;
  state: string;
  connector?: string;
  speedMbps?: number;
  maxSpeedMbps?: number;
  poe?: { standard?: string; type?: number; enabled?: boolean; state?: string };
}

export interface NetworkDevice {
  id: string;
  name: string;
  model: string;
  macAddress: string;
  ipAddress?: string;
  state: string;
  features?: string[];
  firmwareVersion?: string;
  firmwareUpdatable?: boolean;
  interfaces?: string[] | { ports?: DevicePort[] };
  statistics?: {
    uptimeSec?: number;
    cpuUtilizationPct?: number;
    memoryUtilizationPct?: number;
    uplink?: { txRateBps?: number; rxRateBps?: number };
  } | null;
}

export interface NetworkClient {
  id: string;
  name?: string;
  type: string;
  macAddress?: string;
  ipAddress?: string;
  connectedAt?: string;
  uplinkDeviceId?: string;
  access?: { type: string; authorized?: boolean };
}

export interface HotspotVoucher {
  id: string;
  code: string;
  name: string;
  createdAt?: string;
  expiresAt?: string;
  timeLimitMinutes: number;
  authorizedGuestLimit?: number;
  authorizedGuestCount?: number;
  expired?: boolean;
}

export interface VoucherInput {
  name: string;
  count: number;
  timeLimitMinutes: number;
  authorizedGuestLimit?: number;
  dataUsageLimitMBytes?: number;
  rxRateLimitKbps?: number;
  txRateLimitKbps?: number;
}

export interface ProtectCamera {
  id: string;
  name: string;
  state: string;
  mac?: string;
  modelKey?: string;
  isMicEnabled?: boolean;
  featureFlags?: { smartDetectTypes?: string[]; hasHdr?: boolean };
}

export interface ProtectSensor {
  id: string;
  name: string;
  state: string;
  batteryStatus?: { percentage?: number; isLow?: boolean };
}

export type RtspsStreams = Partial<Record<'high' | 'medium' | 'low' | 'package', string | null>>;

export interface AccessDoor {
  id: string;
  name: string;
  full_name?: string;
  door_lock_relay_status?: 'lock' | 'unlock' | string;
  door_position_status?: 'open' | 'close' | string | null;
  is_bind_hub?: boolean;
}

export type LockRuleType = 'keep_lock' | 'keep_unlock' | 'custom' | 'reset' | 'lock_early';

export interface AccessUser {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  status?: string;
  employee_number?: string;
}

export interface DoorOpening {
  '@timestamp'?: string;
  _id?: string;
  _source?: {
    actor?: { display_name?: string; type?: string };
    event?: { result?: string; display_message?: string; published?: number };
    target?: { type?: string; display_name?: string }[];
    authentication?: { credential_provider?: string };
  };
}

const unwrap = async <T>(request: Promise<{ data: { data: T } }>): Promise<T> => (await request).data.data;

const site = (siteId?: string) => (siteId ? { params: { site_id: siteId } } : undefined);

export const unifi = {
  getSettings: () => unwrap<UnifiSettings>(api.get('/unifi/settings')),
  updateSettings: (input: UnifiSettingsInput) => unwrap<UnifiSettings>(api.post('/unifi/settings', input)),
  getStatus: () => unwrap<UnifiStatus>(api.get('/unifi/status')),

  getSites: () => unwrap<NetworkSite[]>(api.get('/unifi/network/sites')),
  getDevices: (siteId?: string) => unwrap<NetworkDevice[]>(api.get('/unifi/network/devices', site(siteId))),
  getDevice: (id: string, siteId?: string) =>
    unwrap<NetworkDevice>(api.get(`/unifi/network/devices/${encodeURIComponent(id)}`, site(siteId))),
  restartDevice: (id: string, siteId?: string) =>
    unwrap(api.post(`/unifi/network/devices/${encodeURIComponent(id)}/restart`, null, site(siteId))),
  powerCyclePort: (id: string, port: number, siteId?: string) =>
    unwrap(api.post(`/unifi/network/devices/${encodeURIComponent(id)}/ports/${port}/power-cycle`, null, site(siteId))),
  getClients: (siteId?: string) => unwrap<NetworkClient[]>(api.get('/unifi/network/clients', site(siteId))),
  setGuestAccess: (id: string, authorize: boolean, siteId?: string) =>
    unwrap(api.post(`/unifi/network/clients/${encodeURIComponent(id)}/guest-access`, { authorize }, site(siteId))),
  getVouchers: (siteId?: string) => unwrap<HotspotVoucher[]>(api.get('/unifi/network/vouchers', site(siteId))),
  createVouchers: (input: VoucherInput, siteId?: string) =>
    unwrap(api.post('/unifi/network/vouchers', input, site(siteId))),
  deleteVoucher: (id: string, siteId?: string) =>
    unwrap(api.delete(`/unifi/network/vouchers/${encodeURIComponent(id)}`, site(siteId))),

  getCameras: () => unwrap<ProtectCamera[]>(api.get('/unifi/protect/cameras')),
  getSnapshot: (id: string, highQuality = false) =>
    unwrap<{ image: string; captured_at: string }>(
      api.get(`/unifi/protect/cameras/${encodeURIComponent(id)}/snapshot`, { params: { high_quality: highQuality } }),
    ),
  gotoPtzPreset: (id: string, slot: number) =>
    unwrap(api.post(`/unifi/protect/cameras/${encodeURIComponent(id)}/ptz/${slot}`)),
  createRtspsStream: (id: string, qualities: string[] = ['high']) =>
    unwrap<RtspsStreams>(api.post(`/unifi/protect/cameras/${encodeURIComponent(id)}/rtsps-stream`, { qualities })),
  getSensors: () => unwrap<ProtectSensor[]>(api.get('/unifi/protect/sensors')),

  getDoors: () => unwrap<AccessDoor[]>(api.get('/unifi/access/doors')),
  unlockDoor: (id: string) => unwrap(api.post(`/unifi/access/doors/${encodeURIComponent(id)}/unlock`)),
  setLockRule: (id: string, type: LockRuleType, interval?: number) =>
    unwrap(api.put(`/unifi/access/doors/${encodeURIComponent(id)}/lock-rule`, { type, interval })),
  getAccessUsers: (page = 1, perPage = 50) =>
    unwrap<AccessUser[]>(api.get('/unifi/access/users', { params: { page, per_page: perPage } })),
  getDoorOpenings: (since?: number, until?: number) =>
    unwrap<{ hits?: DoorOpening[] }>(api.get('/unifi/access/logs', { params: { since, until, per_page: 50 } })),
};

export const unifiError = (error: unknown): string => {
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  return e.response?.data?.message || e.message || 'Request failed';
};
