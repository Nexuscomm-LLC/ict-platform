import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { unifi } from '../../services/unifi';
import type { UnifiSettingsInput } from '../../services/unifi';
import { LoadError, Notice, Spinner, useAction, useLoader } from './shared';
import type { NoticeState } from './shared';

export default function SettingsPanel({ onSaved }: { onSaved: () => void }) {
  const settings = useLoader(() => unifi.getSettings());
  const [form, setForm] = useState<UnifiSettingsInput>({});
  const [notice, setNotice] = useState<NoticeState>(null);
  const { busy, act } = useAction(setNotice);

  useEffect(() => {
    if (settings.data) {
      const { console_url, access_port, site_id, verify_ssl } = settings.data;
      setForm({ console_url, access_port, site_id, verify_ssl });
    }
  }, [settings.data]);

  if (settings.loading && !settings.data) return <Spinner />;
  if (settings.error) {
    return <LoadError error={settings.error} onRetry={settings.reload} />;
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.api_key) delete payload.api_key;
    if (!payload.access_token) delete payload.access_token;
    const ok = await act('save', () => unifi.updateSettings(payload), 'Settings saved — connection status refreshed');
    if (ok) {
      setForm((f) => ({ ...f, api_key: '', access_token: '' }));
      settings.reload();
      onSaved();
    }
  };

  const saved = settings.data;

  return (
    <form className="unifi-card unifi-settings" onSubmit={save}>
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <label>
        Console URL
        <input
          className="unifi-input"
          type="url"
          required
          placeholder="https://192.168.1.1"
          value={form.console_url ?? ''}
          onChange={(e) => setForm({ ...form, console_url: e.target.value })}
        />
        <small>Your UniFi OS console (UDM, UCG, UNVR, Cloud Key). Network and Protect are reached through it.</small>
      </label>
      <label>
        API key
        <input
          className="unifi-input"
          type="password"
          autoComplete="off"
          placeholder={saved?.has_api_key ? '•••••••• saved — leave blank to keep' : 'Paste key'}
          value={form.api_key ?? ''}
          onChange={(e) => setForm({ ...form, api_key: e.target.value })}
        />
        <small>Create one in the console under Settings → Control Plane → Integrations. Used for Network and Protect.</small>
      </label>
      <label>
        Access API token
        <input
          className="unifi-input"
          type="password"
          autoComplete="off"
          placeholder={saved?.has_access_token ? '•••••••• saved — leave blank to keep' : 'Paste token'}
          value={form.access_token ?? ''}
          onChange={(e) => setForm({ ...form, access_token: e.target.value })}
        />
        <small>From UniFi Access → Settings → General → API Token. Leave empty if you don't use Access.</small>
      </label>
      <div className="unifi-form-row">
        <label>
          Access port
          <input
            className="unifi-input narrow"
            type="number"
            min={1}
            max={65535}
            value={form.access_port ?? 12445}
            onChange={(e) => setForm({ ...form, access_port: Number(e.target.value) })}
          />
        </label>
        <label>
          Network site ID
          <input
            className="unifi-input"
            placeholder="Blank = first site"
            value={form.site_id ?? ''}
            onChange={(e) => setForm({ ...form, site_id: e.target.value })}
          />
        </label>
      </div>
      <label className="unifi-check">
        <input type="checkbox" checked={form.verify_ssl ?? true} onChange={(e) => setForm({ ...form, verify_ssl: e.target.checked })} />
        Verify the console's TLS certificate
        <small>Turn off only for consoles still using the factory self-signed certificate on a trusted network.</small>
      </label>
      <button className="unifi-btn primary" type="submit" disabled={busy === 'save'}>
        <Save size={14} /> Save & test connection
      </button>
    </form>
  );
}
