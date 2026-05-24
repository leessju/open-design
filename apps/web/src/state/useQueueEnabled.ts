import { useEffect, useState } from 'react';

import { loadConfig } from './config';

const STORAGE_KEY = 'open-design:config';

/**
 * Reads the Settings → General "Send-Queue" preference.
 *
 * Defaults to `true` (Queue button + Cmd/Ctrl+Shift+Enter shortcut active)
 * so existing users get the feature without opting in. Mirrors the
 * useEnterToSend hook: reads the persisted config blob at mount and stays
 * in sync across tabs via the platform `storage` event. Surfaces that
 * mount fresh after a Settings change (e.g. a popover opened after the
 * dialog closes) pick up the latest value on their next mount.
 *
 * Consumers should gate both UI affordances on this single value so the
 * Queue button cannot get out of sync with the keyboard shortcut.
 */
export function useQueueEnabled(): boolean {
  const [value, setValue] = useState<boolean>(() => loadConfig().queueEnabled ?? true);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (event: StorageEvent): void => {
      if (event.key !== null && event.key !== STORAGE_KEY) return;
      setValue(loadConfig().queueEnabled ?? true);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return value;
}
