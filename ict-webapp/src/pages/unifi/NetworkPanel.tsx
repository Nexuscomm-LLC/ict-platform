import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Power, RefreshCw, Trash2, Zap } from 'lucide-react';
import { unifi } from '../../services/unifi';
import type { DevicePort, NetworkDevice, VoucherInput } from '../../services/unifi';
import {
  LoadError,
  Notice,
  Spinner,
  StateBadge,
  formatRate,
  formatUptime,
  useAction,
  useLoader,
} from './shared';
import type { NoticeState } from './shared';

type View = 'devices' | 'clients' | 'vouchers';

export default function NetworkPanel({ siteId }: { siteId?: string }) {
  const [view, setView] = useState<View>('devices');
  const [notice, setNotice] = useState<NoticeState>(null);

  return (
    <div>
      <div className="unifi-segments" role="tablist">
        {(['devices', 'clients', 'vouchers'] as View[]).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
            {v === 'vouchers' ? 'Guest vouchers' : v[0].toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
      <Notice notice={notice} onClose={() => setNotice(null)} />
      {view === 'devices' && <Devices siteId={siteId} setNotice={setNotice} />}
      {view === 'clients' && <Clients siteId={siteId} setNotice={setNotice} />}
      {view === 'vouchers' && <Vouchers siteId={siteId} setNotice={setNotice} />}
    </div>
  );
}

interface ViewProps {
  siteId?: string;
  setNotice: (n: NoticeState) => void;
}

function Devices({ siteId, setNotice }: ViewProps) {
  const { data, error, loading, reload } = useLoader(() => unifi.getDevices(siteId), [siteId]);
  const { busy, act } = useAction(setNotice);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading && !data) return <Spinner />;
  if (error) return <LoadError error={error} onRetry={reload} />;

  const restart = (d: NetworkDevice) => {
    if (!window.confirm(`Restart ${d.name}? Connected clients will drop for a minute or two.`)) return;
    act(`restart-${d.id}`, () => unifi.restartDevice(d.id, siteId), `${d.name} is restarting`);
  };

  return (
    <div className="unifi-card">
      <div className="unifi-card-head">
        <h3>{data?.length ?? 0} devices</h3>
        <button className="unifi-btn ghost" onClick={reload} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      <table className="unifi-table">
        <thead>
          <tr>
            <th />
            <th>Name</th>
            <th>Model</th>
            <th>IP</th>
            <th>State</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data?.map((d) => (
            <DeviceRow
              key={d.id}
              device={d}
              siteId={siteId}
              expanded={expanded === d.id}
              onToggle={() => setExpanded(expanded === d.id ? null : d.id)}
              onRestart={() => restart(d)}
              busy={busy}
              act={act}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeviceRow({
  device,
  siteId,
  expanded,
  onToggle,
  onRestart,
  busy,
  act,
}: {
  device: NetworkDevice;
  siteId?: string;
  expanded: boolean;
  onToggle: () => void;
  onRestart: () => void;
  busy: string | null;
  act: ReturnType<typeof useAction>['act'];
}) {
  return (
    <>
      <tr>
        <td>
          <button className="unifi-icon-btn" onClick={onToggle} aria-label={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </td>
        <td className="strong">{device.name}</td>
        <td>{device.model}</td>
        <td className="mono">{device.ipAddress ?? '—'}</td>
        <td>
          <StateBadge state={device.state} />
        </td>
        <td className="right">
          <button className="unifi-btn" onClick={onRestart} disabled={busy === `restart-${device.id}`}>
            <Power size={14} /> Restart
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="unifi-detail-row">
          <td colSpan={6}>
            <DeviceDetail id={device.id} siteId={siteId} busy={busy} act={act} />
          </td>
        </tr>
      )}
    </>
  );
}

function DeviceDetail({
  id,
  siteId,
  busy,
  act,
}: {
  id: string;
  siteId?: string;
  busy: string | null;
  act: ReturnType<typeof useAction>['act'];
}) {
  const { data, error, loading, reload } = useLoader(() => unifi.getDevice(id, siteId), [id, siteId]);
  if (loading) return <Spinner />;
  if (error || !data) return <LoadError error={error ?? 'No data'} onRetry={reload} />;

  const stats = data.statistics;
  const ports: DevicePort[] = Array.isArray(data.interfaces) ? [] : data.interfaces?.ports ?? [];
  const poePorts = ports.filter((p) => p.poe?.enabled);

  const powerCycle = (p: DevicePort) => {
    if (!window.confirm(`Power-cycle PoE on port ${p.idx} of ${data.name}? The attached device will reboot.`)) return;
    act(`poe-${id}-${p.idx}`, () => unifi.powerCyclePort(id, p.idx, siteId), `Port ${p.idx} power-cycled`);
  };

  return (
    <div className="unifi-detail">
      <dl className="unifi-stats">
        <div><dt>MAC</dt><dd className="mono">{data.macAddress}</dd></div>
        <div><dt>Firmware</dt><dd>{data.firmwareVersion ?? '—'}{data.firmwareUpdatable ? ' (update available)' : ''}</dd></div>
        <div><dt>Uptime</dt><dd>{formatUptime(stats?.uptimeSec)}</dd></div>
        <div><dt>CPU</dt><dd>{stats?.cpuUtilizationPct !== undefined ? `${stats.cpuUtilizationPct.toFixed(0)}%` : '—'}</dd></div>
        <div><dt>Memory</dt><dd>{stats?.memoryUtilizationPct !== undefined ? `${stats.memoryUtilizationPct.toFixed(0)}%` : '—'}</dd></div>
        <div><dt>Uplink ↑ / ↓</dt><dd>{formatRate(stats?.uplink?.txRateBps)} / {formatRate(stats?.uplink?.rxRateBps)}</dd></div>
      </dl>
      {poePorts.length > 0 && (
        <div className="unifi-ports">
          <h4>PoE ports</h4>
          <div className="unifi-port-grid">
            {poePorts.map((p) => (
              <div key={p.idx} className="unifi-port">
                <span className="strong">Port {p.idx}</span>
                <StateBadge state={p.state === 'UP' ? 'online' : p.state} />
                <span className="muted">{p.poe?.standard ?? 'PoE'}</span>
                <button className="unifi-btn small" onClick={() => powerCycle(p)} disabled={busy === `poe-${id}-${p.idx}`}>
                  <Zap size={12} /> Power-cycle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Clients({ siteId, setNotice }: ViewProps) {
  const { data, error, loading, reload } = useLoader(() => unifi.getClients(siteId), [siteId]);
  const { busy, act } = useAction(setNotice);
  const [filter, setFilter] = useState('');

  if (loading && !data) return <Spinner />;
  if (error) return <LoadError error={error} onRetry={reload} />;

  const q = filter.toLowerCase();
  const rows = (data ?? []).filter(
    (c) => !q || [c.name, c.macAddress, c.ipAddress].some((v) => v?.toLowerCase().includes(q)),
  );

  const toggleGuest = async (id: string, label: string, authorize: boolean) => {
    const ok = await act(
      `guest-${id}`,
      () => unifi.setGuestAccess(id, authorize, siteId),
      `${label}: guest access ${authorize ? 'authorized' : 'revoked'}`,
    );
    if (ok) reload();
  };

  return (
    <div className="unifi-card">
      <div className="unifi-card-head">
        <h3>{data?.length ?? 0} clients</h3>
        <input className="unifi-input" placeholder="Filter by name, MAC or IP" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button className="unifi-btn ghost" onClick={reload} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      <table className="unifi-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>IP</th>
            <th>MAC</th>
            <th>Type</th>
            <th>Access</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const label = c.name || c.macAddress || c.id;
            const isGuest = c.access?.type === 'GUEST';
            return (
              <tr key={c.id}>
                <td className="strong">{label}</td>
                <td className="mono">{c.ipAddress ?? '—'}</td>
                <td className="mono">{c.macAddress ?? '—'}</td>
                <td>{c.type.toLowerCase()}</td>
                <td>{isGuest ? (c.access?.authorized ? 'guest (authorized)' : 'guest') : 'default'}</td>
                <td className="right">
                  {isGuest && (
                    <button
                      className="unifi-btn small"
                      disabled={busy === `guest-${c.id}`}
                      onClick={() => toggleGuest(c.id, label, !c.access?.authorized)}
                    >
                      {c.access?.authorized ? 'Revoke' : 'Authorize'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <p className="unifi-muted-line">No clients match.</p>}
    </div>
  );
}

const EMPTY_VOUCHER: VoucherInput = { name: '', count: 1, timeLimitMinutes: 1440 };

function Vouchers({ siteId, setNotice }: ViewProps) {
  const { data, error, loading, reload } = useLoader(() => unifi.getVouchers(siteId), [siteId]);
  const { busy, act } = useAction(setNotice);
  const [form, setForm] = useState<VoucherInput>(EMPTY_VOUCHER);

  if (loading && !data) return <Spinner />;
  if (error) return <LoadError error={error} onRetry={reload} />;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await act('create', () => unifi.createVouchers(form, siteId), `Created ${form.count} voucher(s)`);
    if (ok) {
      setForm(EMPTY_VOUCHER);
      reload();
    }
  };

  const remove = async (id: string, code: string) => {
    if (!window.confirm(`Delete voucher ${code}?`)) return;
    if (await act(`del-${id}`, () => unifi.deleteVoucher(id, siteId), `Voucher ${code} deleted`)) reload();
  };

  return (
    <div className="unifi-card">
      <form className="unifi-form-row" onSubmit={create}>
        <input className="unifi-input" placeholder="Voucher name (e.g. Lobby guests)" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label>
          Count
          <input className="unifi-input narrow" type="number" min={1} max={1000} value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} />
        </label>
        <label>
          Valid for
          <select className="unifi-input" value={form.timeLimitMinutes} onChange={(e) => setForm({ ...form, timeLimitMinutes: Number(e.target.value) })}>
            <option value={60}>1 hour</option>
            <option value={480}>8 hours</option>
            <option value={1440}>1 day</option>
            <option value={10080}>1 week</option>
          </select>
        </label>
        <button className="unifi-btn primary" type="submit" disabled={busy === 'create'}>
          <Plus size={14} /> Create
        </button>
      </form>
      <table className="unifi-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Duration</th>
            <th>Guests</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data?.map((v) => (
            <tr key={v.id}>
              <td className="mono strong">{v.code}</td>
              <td>{v.name}</td>
              <td>{v.timeLimitMinutes >= 1440 ? `${Math.round(v.timeLimitMinutes / 1440)}d` : `${Math.round(v.timeLimitMinutes / 60)}h`}</td>
              <td>{v.authorizedGuestCount ?? 0}{v.authorizedGuestLimit ? ` / ${v.authorizedGuestLimit}` : ''}</td>
              <td><StateBadge state={v.expired ? 'expired' : 'active'} /></td>
              <td className="right">
                <button className="unifi-icon-btn danger" onClick={() => remove(v.id, v.code)} disabled={busy === `del-${v.id}`} aria-label={`Delete voucher ${v.code}`}>
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data?.length === 0 && <p className="unifi-muted-line">No vouchers yet.</p>}
    </div>
  );
}
