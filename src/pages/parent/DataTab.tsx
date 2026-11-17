import React, { useRef, useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { Avatar, Btn, Card, ConfirmDialog } from '../../components/kit';
import { downloadText } from '../../lib/storage';

export default function DataTab() {
  const app = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [includeKey, setIncludeKey] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const delProfile = app.profiles.find((p) => p.id === delId);

  const doExport = () => {
    downloadText(`cadangan-cepat-tepat-${new Date().toISOString().slice(0, 10)}.json`, app.exportData(includeKey));
    toast.success('File cadangan diunduh.');
  };
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPending(String(reader.result));
    reader.readAsText(f);
    e.target.value = '';
  };

  return (
    <div className="anim-up grid gap-6">
      <section>
        <h2 className="font-heading text-base md:text-lg font-bold mb-3">Profil anak</h2>
        <div className="grid gap-2">
          {app.profiles.map((p) => (
            <Card key={p.id} className="p-3 flex items-center gap-3">
              <Avatar color={p.color} icon={p.icon} size="sm" />
              <div className="flex-1 min-w-0"><p className="font-semibold truncate">{p.name}</p><p className="text-xs text-stone-500">{p.totalScore} poin · {p.history.length} sesi</p></div>
              <button data-testid={`delete-profile-${p.id}`} onClick={() => setDelId(p.id)} className="min-h-[40px] px-3 rounded-xl border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-1.5"><Trash2 className="w-4 h-4" />Hapus</button>
            </Card>
          ))}
          {app.profiles.length === 0 && <p className="text-sm text-stone-500">Belum ada profil.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-heading text-base md:text-lg font-bold mb-1">Cadangkan data</h2>
        <p className="text-sm text-stone-500 mb-3">Simpan semua profil, progres, soal tambahan, dan pengaturan ke file JSON.</p>
        <label className="flex items-center gap-3 mb-3 text-sm">
          <input type="checkbox" data-testid="export-include-key" checked={includeKey} onChange={(e) => setIncludeKey(e.target.checked)} className="w-5 h-5 accent-emerald-700" />
          Sertakan Gemini API key (hati-hati saat membagikan file)
        </label>
        <Btn data-testid="export-data-btn" className="w-full" onClick={doExport}><Download className="w-5 h-5" />Ekspor data</Btn>
      </section>

      <section>
        <h2 className="font-heading text-base md:text-lg font-bold mb-1">Pulihkan dari file</h2>
        <p className="text-sm text-stone-500 mb-3">Data saat ini akan diganti dengan isi file cadangan.</p>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" data-testid="import-file-input" onChange={onFile} />
        <Btn variant="secondary" data-testid="import-data-btn" className="w-full" onClick={() => fileRef.current?.click()}><Upload className="w-5 h-5" />Impor data</Btn>
      </section>

      <ConfirmDialog open={!!pending} onClose={() => setPending(null)} title="Ganti data dengan file cadangan?" message="Profil, progres, dan soal tambahan di perangkat ini akan diganti seluruhnya." confirmLabel="Impor"
        onConfirm={() => { if (!pending) return; const r = app.importData(pending); r.ok ? toast.success(r.msg) : toast.error(r.msg); }} />
      <ConfirmDialog open={!!delProfile} onClose={() => setDelId(null)} title={`Hapus profil ${delProfile?.name ?? ''}?`}
        message={<>Semua skor, streak, riwayat, dan daftar soal salah milik profil ini akan <b className="text-rose-700">hilang permanen</b> dan tidak bisa dikembalikan, kecuali Anda punya file cadangan.</>}
        requireText={delProfile?.name} confirmLabel="Hapus permanen" onConfirm={() => { if (delId) { app.deleteProfile(delId); toast.success('Profil dihapus.'); } }} />
    </div>
  );
}
