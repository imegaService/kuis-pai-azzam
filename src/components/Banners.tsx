import React from 'react';
import { WifiOff, AlertTriangle, Download, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { downloadText } from '../lib/storage';

export function Banners() {
  const app = useApp();
  return (
    <>
      {!app.online && app.settings.offlineNotice && (
        <div data-testid="offline-banner" className="bg-stone-800 text-stone-100 text-sm px-4 py-2 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" /> Mode offline — semua latihan tetap jalan. Fitur AI nonaktif.
        </div>
      )}
      {app.storageError && (
        <div data-testid="storage-error-banner" className="bg-amber-100 text-amber-900 text-sm px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="flex-1">{app.storageError}</p>
            <button data-testid="storage-export-btn" onClick={() => downloadText(`cadangan-cepat-tepat-${Date.now()}.json`, app.exportData(false))} className="shrink-0 inline-flex items-center gap-1 font-semibold underline"><Download className="w-4 h-4" />Ekspor</button>
            <button data-testid="storage-dismiss-btn" aria-label="Tutup" onClick={app.dismissStorageError}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </>
  );
}
