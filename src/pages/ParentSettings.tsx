import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Page, TopBar } from '../components/kit';
import { PARENT_FLAG } from './PinGate';
import QuestionsTab from './parent/QuestionsTab';
import DataTab from './parent/DataTab';
import GeneralTab from './parent/GeneralTab';
import AiTab from './parent/AiTab';

const TABS = [
  { id: 'soal', label: 'Soal' },
  { id: 'data', label: 'Data' },
  { id: 'umum', label: 'Umum' },
  { id: 'ai', label: 'AI' },
];

export default function ParentSettings() {
  const location = useLocation();
  const nav = useNavigate();
  const [tab, setTab] = useState<string>((location.state as any)?.tab ?? 'soal');
  useEffect(() => { if ((location.state as any)?.saved) { toast.success('Soal tersimpan.'); nav('.', { replace: true, state: { tab: 'soal' } }); } }, []); // eslint-disable-line
  const lock = () => { sessionStorage.removeItem(PARENT_FLAG); nav('/', { replace: true }); };
  return (
    <>
      <TopBar title="Menu Orang Tua" back="/" right={<button data-testid="parent-lock-btn" onClick={lock} className="min-h-[44px] px-3 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-200/60 flex items-center gap-1"><LogOut className="w-4 h-4" />Kunci</button>} />
      <div className="sticky top-16 z-20 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/70">
        <div className="max-w-2xl mx-auto px-4 grid grid-cols-4">
          {TABS.map((t) => (
            <button key={t.id} data-testid={`parent-tab-${t.id}`} onClick={() => setTab(t.id)}
              className={`min-h-[48px] px-2 text-sm font-semibold border-b-2 transition-colors ${tab === t.id ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <Page>
        {tab === 'soal' && <QuestionsTab />}
        {tab === 'data' && <DataTab />}
        {tab === 'umum' && <GeneralTab />}
        {tab === 'ai' && <AiTab />}
      </Page>
    </>
  );
}
