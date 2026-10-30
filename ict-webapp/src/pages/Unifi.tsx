import { useState } from 'react';
import { Cctv, DoorOpen, Network, Settings as SettingsIcon } from 'lucide-react';
import { unifi } from '../services/unifi';
import type { AppStatus } from '../services/unifi';
import { useLoader } from './unifi/shared';
import NetworkPanel from './unifi/NetworkPanel';
import ProtectPanel from './unifi/ProtectPanel';
import AccessPanel from './unifi/AccessPanel';
import SettingsPanel from './unifi/SettingsPanel';

type Tab = 'network' | 'protect' | 'access' | 'settings';

const TABS: { key: Tab; label: string; icon: typeof Network }[] = [
  { key: 'network', label: 'Network', icon: Network },
  { key: 'protect', label: 'Protect', icon: Cctv },
  { key: 'access', label: 'Access', icon: DoorOpen },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

function StatusChip({ label, status }: { label: string; status?: AppStatus }) {
  const tone = !status ? 'idle' : !status.configured ? 'idle' : status.reachable ? 'ok' : 'bad';
  const text = !status
    ? 'checking…'
    : !status.configured
      ? 'not configured'
      : status.reachable
        ? status.version
          ? `v${status.version}`
          : 'connected'
        : 'unreachable';
  return (
    <div className={`unifi-chip ${tone}`} title={status?.error ?? undefined}>
      <span className="dot" />
      <span className="strong">{label}</span>
      <span>{text}</span>
    </div>
  );
}

export default function Unifi() {
  const [tab, setTab] = useState<Tab>('network');
  const status = useLoader(() => unifi.getStatus());
  const s = status.data;

  const needsSetup = s && !s.network.configured && !s.access.configured;
  const activeTab: Tab = needsSetup ? 'settings' : tab;
  const blocked = s && activeTab !== 'settings' && !s[activeTab].configured;

  return (
    <div className="unifi-page">
      <header className="unifi-header">
        <div>
          <h1>UniFi</h1>
          <p className="muted">Network, Protect and Access on your UniFi console</p>
        </div>
        <div className="unifi-chips">
          <StatusChip label="Network" status={s?.network} />
          <StatusChip label="Protect" status={s?.protect} />
          <StatusChip label="Access" status={s?.access} />
        </div>
      </header>

      {status.error && <div className="unifi-notice error">{status.error}</div>}
      {needsSetup && (
        <div className="unifi-notice info">Connect your UniFi console to get started — add its URL and API key below.</div>
      )}

      <nav className="unifi-tabs" role="tablist">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            className={activeTab === key ? 'active' : ''}
            onClick={() => setTab(key)}
            disabled={!!needsSetup && key !== 'settings'}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>

      {blocked ? (
        <div className="unifi-empty">
          <p>
            UniFi {activeTab[0].toUpperCase() + activeTab.slice(1)} isn't configured yet.{' '}
            <button className="unifi-link" onClick={() => setTab('settings')}>Open settings</button>
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'network' && <NetworkPanel />}
          {activeTab === 'protect' && <ProtectPanel />}
          {activeTab === 'access' && <AccessPanel />}
          {activeTab === 'settings' && <SettingsPanel onSaved={status.reload} />}
        </>
      )}

      <style>{UNIFI_CSS}</style>
    </div>
  );
}

const UNIFI_CSS = `
.unifi-page { padding: 24px; max-width: 1400px; margin: 0 auto; }
.unifi-page .muted { color: var(--text-muted); }
.unifi-page .small { font-size: 12px; }
.unifi-page .strong { font-weight: 600; }
.unifi-page .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
.unifi-page .right { text-align: right; }
.unifi-page .warn-text { color: #d97706; }
.unifi-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.unifi-header h1 { font-size: 24px; margin-bottom: 4px; }
.unifi-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.unifi-chip { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: var(--bg-primary); border: 1px solid var(--border-color); font-size: 13px; }
.unifi-chip .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); }
.unifi-chip.ok .dot { background: #16a34a; }
.unifi-chip.bad .dot { background: #dc2626; }
.unifi-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border-color); margin-bottom: 20px; overflow-x: auto; }
.unifi-tabs button { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border: none; background: none; color: var(--text-muted); font-size: 14px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap; }
.unifi-tabs button.active { color: var(--primary); border-bottom-color: var(--primary); }
.unifi-tabs button:disabled { opacity: 0.4; cursor: not-allowed; }
.unifi-segments { display: inline-flex; background: var(--bg-tertiary); border-radius: 8px; padding: 3px; margin-bottom: 16px; }
.unifi-segments button { border: none; background: none; padding: 6px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; color: var(--text-muted); }
.unifi-segments button.active { background: var(--bg-primary); color: var(--text-primary); font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
.unifi-card { background: var(--bg-primary); border-radius: 12px; padding: 16px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 20px; overflow-x: auto; }
.unifi-card h3 { font-size: 15px; margin-bottom: 12px; }
.unifi-card-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.unifi-card-head h3 { margin: 0; flex: 1; font-size: 15px; }
.unifi-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.unifi-table th { text-align: left; font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.03em; padding: 8px 10px; border-bottom: 1px solid var(--border-color); }
.unifi-table td { padding: 10px; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
.unifi-table tr:last-child td { border-bottom: none; }
.unifi-detail-row > td { background: var(--bg-secondary); }
.unifi-detail { padding: 8px 4px; }
.unifi-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin-bottom: 12px; }
.unifi-stats dt { font-size: 12px; color: var(--text-muted); }
.unifi-stats dd { font-weight: 600; }
.unifi-ports h4 { font-size: 13px; margin-bottom: 8px; }
.unifi-port-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; }
.unifi-port { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px; }
.unifi-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 500; text-transform: capitalize; background: var(--bg-tertiary); color: var(--text-muted); }
.unifi-badge.ok { background: #dcfce7; color: #166534; }
.unifi-badge.bad { background: #fee2e2; color: #991b1b; }
.unifi-badge.warn { background: #fef3c7; color: #92400e; }
.unifi-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; }
.unifi-btn:hover:not(:disabled) { background: var(--bg-secondary); }
.unifi-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.unifi-btn.primary { background: var(--primary); border-color: var(--primary); color: #fff; }
.unifi-btn.primary:hover:not(:disabled) { opacity: 0.9; background: var(--primary); }
.unifi-btn.ghost { border-color: transparent; background: none; color: var(--text-muted); }
.unifi-btn.small { padding: 4px 8px; font-size: 12px; }
.unifi-btn.block { width: 100%; justify-content: center; }
.unifi-icon-btn { display: inline-flex; padding: 4px; border: none; background: none; color: var(--text-muted); cursor: pointer; border-radius: 6px; }
.unifi-icon-btn:hover { background: var(--bg-secondary); color: var(--text-primary); }
.unifi-icon-btn.danger:hover { color: #dc2626; }
.unifi-link { border: none; background: none; color: var(--primary); cursor: pointer; font: inherit; text-decoration: underline; }
.unifi-input { padding: 8px 10px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; min-width: 0; }
.unifi-input.narrow { width: 88px; }
.unifi-card-head .unifi-input { flex: 0 1 260px; }
.unifi-form-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 16px; }
.unifi-form-row > .unifi-input { flex: 1 1 220px; }
.unifi-form-row label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--text-muted); }
.unifi-notice { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
.unifi-notice span { flex: 1; }
.unifi-notice button { border: none; background: none; font-size: 18px; line-height: 1; cursor: pointer; color: inherit; }
.unifi-notice.success { background: #dcfce7; color: #166534; }
.unifi-notice.error { background: #fee2e2; color: #991b1b; }
.unifi-notice.info { background: #dbeafe; color: #1e40af; }
.unifi-empty { text-align: center; padding: 40px 16px; background: var(--bg-primary); border-radius: 12px; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 12px; }
.unifi-empty.error { color: #991b1b; }
.unifi-muted-line { color: var(--text-muted); text-align: center; padding: 16px; font-size: 14px; }
.unifi-spinner { width: 28px; height: 28px; border: 3px solid var(--bg-tertiary); border-top-color: var(--primary); border-radius: 50%; animation: unifi-spin 0.8s linear infinite; margin: 32px auto; }
@keyframes unifi-spin { to { transform: rotate(360deg); } }
.unifi-camera-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-bottom: 20px; }
.unifi-camera { background: var(--bg-primary); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.unifi-snapshot { position: relative; aspect-ratio: 16 / 9; background: #0f172a; }
.unifi-snapshot img { width: 100%; height: 100%; object-fit: cover; display: block; }
.unifi-snapshot-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #94a3b8; font-size: 13px; padding: 12px; text-align: center; }
.unifi-snapshot-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(15,23,42,0.4); }
.unifi-camera-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
.unifi-camera-title { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.unifi-camera-actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.unifi-ptz { display: inline-flex; gap: 4px; align-items: center; }
.unifi-ptz .unifi-input { width: 56px; padding: 4px 6px; font-size: 12px; }
.unifi-stream { display: flex; gap: 6px; align-items: center; background: var(--bg-secondary); border-radius: 6px; padding: 6px 8px; }
.unifi-stream code { flex: 1; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.unifi-door-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; margin-bottom: 20px; }
.unifi-door { background: var(--bg-primary); border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); display: flex; flex-direction: column; gap: 12px; }
.unifi-door-head { display: flex; gap: 12px; align-items: center; }
.unifi-door-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.unifi-door-icon.locked { background: #dcfce7; color: #166534; }
.unifi-door-icon.unlocked { background: #fef3c7; color: #92400e; }
.unifi-door-states { display: flex; gap: 4px; margin-top: 4px; }
.unifi-rule { display: flex; gap: 6px; flex-wrap: wrap; }
.unifi-rule select { flex: 1; }
.unifi-rule.with-minutes select { flex-basis: 100%; }
.unifi-rule.with-minutes .unifi-input.narrow { flex: 1; }
.unifi-two-col { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 20px; }
@media (max-width: 900px) { .unifi-two-col { grid-template-columns: 1fr; } }
.unifi-settings { max-width: 640px; display: flex; flex-direction: column; gap: 16px; }
.unifi-settings label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 500; }
.unifi-settings small { font-weight: 400; font-size: 12px; color: var(--text-muted); }
.unifi-settings .unifi-form-row { margin-bottom: 0; }
.unifi-check { flex-direction: row !important; flex-wrap: wrap; align-items: center; }
.unifi-check small { flex-basis: 100%; }
.unifi-settings > .unifi-btn { align-self: flex-start; }
@media (max-width: 640px) {
  .unifi-page { padding: 16px; }
  .unifi-table { font-size: 13px; }
  .unifi-camera-grid { grid-template-columns: 1fr; }
}
`;
