import { useEffect, useState } from 'react';
import { Copy, Move, RefreshCw, Video } from 'lucide-react';
import { unifi, unifiError } from '../../services/unifi';
import type { ProtectCamera } from '../../services/unifi';
import { LoadError, Notice, Spinner, StateBadge, useAction, useLoader } from './shared';
import type { NoticeState } from './shared';

export default function ProtectPanel() {
  const cameras = useLoader(() => unifi.getCameras());
  const sensors = useLoader(() => unifi.getSensors());
  const [notice, setNotice] = useState<NoticeState>(null);

  if (cameras.loading && !cameras.data) return <Spinner />;
  if (cameras.error) return <LoadError error={cameras.error} onRetry={cameras.reload} />;

  const online = cameras.data?.filter((c) => c.state === 'CONNECTED').length ?? 0;

  return (
    <div>
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <div className="unifi-card-head">
        <h3>
          {cameras.data?.length ?? 0} cameras · {online} online
        </h3>
        <button className="unifi-btn ghost" onClick={cameras.reload}>
          <RefreshCw size={14} /> Refresh list
        </button>
      </div>
      <div className="unifi-camera-grid">
        {cameras.data?.map((c) => <CameraCard key={c.id} camera={c} setNotice={setNotice} />)}
      </div>

      {sensors.data && sensors.data.length > 0 && (
        <div className="unifi-card">
          <h3>Sensors</h3>
          <table className="unifi-table">
            <thead>
              <tr><th>Name</th><th>State</th><th>Battery</th></tr>
            </thead>
            <tbody>
              {sensors.data.map((s) => (
                <tr key={s.id}>
                  <td className="strong">{s.name}</td>
                  <td><StateBadge state={s.state} /></td>
                  <td className={s.batteryStatus?.isLow ? 'warn-text' : ''}>
                    {s.batteryStatus?.percentage !== undefined ? `${s.batteryStatus.percentage}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CameraCard({ camera, setNotice }: { camera: ProtectCamera; setNotice: (n: NoticeState) => void }) {
  const [snapshot, setSnapshot] = useState<{ image: string; captured_at: string } | null>(null);
  const [snapError, setSnapError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preset, setPreset] = useState(0);
  const [stream, setStream] = useState<string | null>(null);
  const { busy, act } = useAction(setNotice);
  const connected = camera.state === 'CONNECTED';

  const refresh = async () => {
    setLoading(true);
    setSnapError(null);
    try {
      setSnapshot(await unifi.getSnapshot(camera.id));
    } catch (e) {
      setSnapError(unifiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera.id, connected]);

  const getStream = () =>
    act(
      `stream-${camera.id}`,
      async () => {
        const streams = await unifi.createRtspsStream(camera.id, ['high']);
        setStream(streams.high ?? null);
      },
      `RTSPS stream ready for ${camera.name}`,
    );

  return (
    <div className="unifi-camera">
      <div className="unifi-snapshot">
        {snapshot ? (
          <img src={snapshot.image} alt={`Latest frame from ${camera.name}`} />
        ) : (
          <div className="unifi-snapshot-empty">
            <Video size={28} />
            <span>{connected ? (snapError ?? 'Loading…') : 'Camera offline'}</span>
          </div>
        )}
        {loading && <div className="unifi-snapshot-loading"><Spinner /></div>}
      </div>
      <div className="unifi-camera-body">
        <div className="unifi-camera-title">
          <span className="strong">{camera.name}</span>
          <StateBadge state={camera.state} />
        </div>
        {snapshot && <span className="muted small">Captured {new Date(snapshot.captured_at).toLocaleTimeString()}</span>}
        <div className="unifi-camera-actions">
          <button className="unifi-btn small" onClick={refresh} disabled={!connected || loading}>
            <RefreshCw size={12} /> Snapshot
          </button>
          <button className="unifi-btn small" onClick={getStream} disabled={!connected || busy === `stream-${camera.id}`}>
            <Video size={12} /> RTSPS URL
          </button>
          <span className="unifi-ptz">
            <input
              className="unifi-input narrow"
              type="number"
              min={0}
              max={15}
              value={preset}
              aria-label="PTZ preset slot"
              onChange={(e) => setPreset(Number(e.target.value))}
            />
            <button
              className="unifi-btn small"
              disabled={!connected || busy === `ptz-${camera.id}`}
              title="Move a PTZ camera to a saved preset"
              onClick={() => act(`ptz-${camera.id}`, () => unifi.gotoPtzPreset(camera.id, preset), `${camera.name} moving to preset ${preset}`)}
            >
              <Move size={12} /> Preset
            </button>
          </span>
        </div>
        {stream && (
          <div className="unifi-stream">
            <code>{stream}</code>
            <button className="unifi-icon-btn" aria-label="Copy stream URL" onClick={() => navigator.clipboard?.writeText(stream)}>
              <Copy size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
