import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { unifiError } from '../../services/unifi';

export function useLoader<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await run());
    } catch (e) {
      setError(unifiError(e));
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload };
}

export type NoticeState = { kind: 'success' | 'error'; text: string } | null;

/** Runs a control action, reporting the outcome through a notice. Returns true on success. */
export function useAction(setNotice: (n: NoticeState) => void) {
  const [busy, setBusy] = useState<string | null>(null);

  const act = useCallback(
    async (key: string, action: () => Promise<unknown>, success: string) => {
      setBusy(key);
      try {
        await action();
        setNotice({ kind: 'success', text: success });
        return true;
      } catch (e) {
        setNotice({ kind: 'error', text: unifiError(e) });
        return false;
      } finally {
        setBusy(null);
      }
    },
    [setNotice],
  );

  return { busy, act };
}

export function Notice({ notice, onClose }: { notice: NoticeState; onClose: () => void }) {
  if (!notice) return null;
  const Icon = notice.kind === 'success' ? CheckCircle2 : AlertTriangle;
  return (
    <div className={`unifi-notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
      <Icon size={16} />
      <span>{notice.text}</span>
      <button onClick={onClose} aria-label="Dismiss">×</button>
    </div>
  );
}

export function LoadError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="unifi-empty error">
      <AlertTriangle size={20} />
      <p>{error}</p>
      <button className="unifi-btn" onClick={onRetry}>
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}

const STATE_TONE: Record<string, string> = {
  online: 'ok',
  connected: 'ok',
  lock: 'ok',
  close: 'ok',
  active: 'ok',
  granted: 'ok',
  blocked: 'bad',
  denied: 'bad',
  offline: 'bad',
  disconnected: 'bad',
  unlock: 'warn',
  open: 'warn',
};

const STATE_LABEL: Record<string, string> = { lock: 'locked', unlock: 'unlocked', close: 'closed' };

export function StateBadge({ state }: { state?: string | null }) {
  if (!state) return <span className="unifi-badge">unknown</span>;
  const key = state.toLowerCase();
  return <span className={`unifi-badge ${STATE_TONE[key] ?? 'warn'}`}>{STATE_LABEL[key] ?? key.replace(/_/g, ' ')}</span>;
}

export function Spinner() {
  return <div className="unifi-spinner" aria-label="Loading" />;
}

export const formatUptime = (sec?: number) => {
  if (!sec) return '—';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  return d ? `${d}d ${h}h` : `${h}h ${Math.floor((sec % 3600) / 60)}m`;
};

export const formatRate = (bps?: number) => {
  if (bps === undefined) return '—';
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(1)} Gbps`;
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} Mbps`;
  return `${Math.round(bps / 1e3)} kbps`;
};
