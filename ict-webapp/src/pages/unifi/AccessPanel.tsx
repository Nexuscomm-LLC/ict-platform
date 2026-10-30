import { useState } from 'react';
import { DoorOpen, Lock, RefreshCw, Unlock } from 'lucide-react';
import { unifi } from '../../services/unifi';
import type { AccessDoor, LockRuleType } from '../../services/unifi';
import { LoadError, Notice, Spinner, StateBadge, useAction, useLoader } from './shared';
import type { NoticeState } from './shared';

const RULES: { value: LockRuleType; label: string }[] = [
  { value: 'keep_unlock', label: 'Keep unlocked' },
  { value: 'keep_lock', label: 'Keep locked' },
  { value: 'custom', label: 'Unlock for…' },
  { value: 'lock_early', label: 'End schedule early' },
  { value: 'reset', label: 'Back to schedule' },
];

export default function AccessPanel() {
  const doors = useLoader(() => unifi.getDoors());
  const logs = useLoader(() => unifi.getDoorOpenings());
  const users = useLoader(() => unifi.getAccessUsers());
  const [notice, setNotice] = useState<NoticeState>(null);

  if (doors.loading && !doors.data) return <Spinner />;
  if (doors.error) return <LoadError error={doors.error} onRetry={doors.reload} />;

  const refreshAll = () => {
    doors.reload();
    logs.reload();
  };

  return (
    <div>
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <div className="unifi-card-head">
        <h3>{doors.data?.length ?? 0} doors</h3>
        <button className="unifi-btn ghost" onClick={refreshAll}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      <div className="unifi-door-grid">
        {doors.data?.map((d) => <DoorCard key={d.id} door={d} setNotice={setNotice} onChanged={refreshAll} />)}
      </div>

      <div className="unifi-two-col">
        <div className="unifi-card">
          <h3>Door activity · last 24h</h3>
          {logs.loading ? (
            <Spinner />
          ) : logs.error ? (
            <LoadError error={logs.error} onRetry={logs.reload} />
          ) : (
            <table className="unifi-table">
              <thead>
                <tr><th>Time</th><th>Who</th><th>Door</th><th>Method</th><th>Result</th></tr>
              </thead>
              <tbody>
                {(logs.data?.hits ?? []).map((h, i) => {
                  const src = h._source ?? {};
                  const door = src.target?.find((t) => t.type === 'door')?.display_name;
                  return (
                    <tr key={h._id ?? i}>
                      <td>{h['@timestamp'] ? new Date(h['@timestamp']).toLocaleString() : '—'}</td>
                      <td className="strong">{src.actor?.display_name ?? '—'}</td>
                      <td>{door ?? '—'}</td>
                      <td>{src.authentication?.credential_provider?.toLowerCase().replace(/_/g, ' ') ?? '—'}</td>
                      <td><StateBadge state={src.event?.result === 'ACCESS' ? 'granted' : src.event?.result} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!logs.loading && !logs.error && (logs.data?.hits ?? []).length === 0 && (
            <p className="unifi-muted-line">No door openings in the last 24 hours.</p>
          )}
        </div>

        <div className="unifi-card">
          <h3>Users</h3>
          {users.loading ? (
            <Spinner />
          ) : users.error ? (
            <LoadError error={users.error} onRetry={users.reload} />
          ) : (
            <table className="unifi-table">
              <thead>
                <tr><th>Name</th><th>Employee #</th><th>Status</th></tr>
              </thead>
              <tbody>
                {(users.data ?? []).map((u) => (
                  <tr key={u.id}>
                    <td className="strong">{u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.id}</td>
                    <td>{u.employee_number || '—'}</td>
                    <td><StateBadge state={u.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function DoorCard({
  door,
  setNotice,
  onChanged,
}: {
  door: AccessDoor;
  setNotice: (n: NoticeState) => void;
  onChanged: () => void;
}) {
  const { busy, act } = useAction(setNotice);
  const [rule, setRule] = useState<LockRuleType>('keep_unlock');
  const [minutes, setMinutes] = useState(15);
  const locked = door.door_lock_relay_status !== 'unlock';
  const name = door.full_name || door.name;

  const unlock = async () => {
    if (!window.confirm(`Unlock ${name} now?`)) return;
    if (await act(`unlock-${door.id}`, () => unifi.unlockDoor(door.id), `${name} unlocked`)) onChanged();
  };

  const applyRule = async () => {
    const label = RULES.find((r) => r.value === rule)?.label ?? rule;
    const detail = rule === 'custom' ? `Unlocked for ${minutes} min` : label;
    if (rule === 'keep_unlock' && !window.confirm(`Keep ${name} unlocked until changed?`)) return;
    if (await act(`rule-${door.id}`, () => unifi.setLockRule(door.id, rule, rule === 'custom' ? minutes : undefined), `${name}: ${detail}`)) {
      onChanged();
    }
  };

  return (
    <div className="unifi-door">
      <div className="unifi-door-head">
        <div className={`unifi-door-icon ${locked ? 'locked' : 'unlocked'}`}>
          {locked ? <Lock size={18} /> : <Unlock size={18} />}
        </div>
        <div>
          <div className="strong">{name}</div>
          <div className="unifi-door-states">
            <StateBadge state={door.door_lock_relay_status ?? null} />
            {door.door_position_status && <StateBadge state={door.door_position_status} />}
          </div>
        </div>
      </div>
      <button className="unifi-btn primary block" onClick={unlock} disabled={busy === `unlock-${door.id}`}>
        <DoorOpen size={14} /> Unlock now
      </button>
      <div className={`unifi-rule ${rule === 'custom' ? 'with-minutes' : ''}`}>
        <select className="unifi-input" value={rule} onChange={(e) => setRule(e.target.value as LockRuleType)} aria-label={`Lock rule for ${name}`}>
          {RULES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        {rule === 'custom' && (
          <input
            className="unifi-input narrow"
            type="number"
            min={1}
            max={1440}
            value={minutes}
            aria-label="Minutes"
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        )}
        <button className="unifi-btn" onClick={applyRule} disabled={busy === `rule-${door.id}`}>Apply</button>
      </div>
    </div>
  );
}
