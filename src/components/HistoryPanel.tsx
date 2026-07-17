import { useState } from 'react';
import { HistoryRecord } from '../types';
import Icon from './Icon';
import SwipeToDelete from './SwipeToDelete';
import { triggerHaptic } from '../utils/haptics';

interface HistoryPanelProps {
  records: HistoryRecord[];
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
}

export default function HistoryPanel({ records, onDeleteRecord, onClearAll, onClose, onToggleFavorite }: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredRecords = records.filter(rec => {
    if (showFavoritesOnly && !rec.isFavorite) return false;
    
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const formattedDate = new Date(rec.date).toLocaleDateString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });

    return (
      rec.patientName.toLowerCase().includes(query) ||
      formattedDate.includes(query)
    );
  });

  return (
    <div className="flex flex-col h-full bg-surface text-on-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-surface-variant">
        <div className="flex items-center gap-2">
          <Icon name="history" className="text-primary text-[20px]" />
          <h2 className="font-title-md font-bold text-lg">Histórico Obstétrico</h2>
        </div>
        <div className="flex items-center gap-3">
          {records.length > 0 && (
            <button
              onClick={() => {
                triggerHaptic([100, 50, 100]);
                if (window.confirm('Deseja realmente limpar todo o histórico?')) {
                  onClearAll();
                }
              }}
              className="text-xs font-semibold text-error hover:text-error/80 transition-colors cursor-pointer"
            >
              Limpar Tudo
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-variant text-secondary transition-colors cursor-pointer"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {records.length > 0 && (
        <div className="px-4 pt-4 pb-1 flex gap-2">
          <div className="relative flex-grow">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-[16px]" />
            <input
              type="text"
              placeholder="Pesquisar por paciente ou data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ios-input w-full pl-10 h-11 text-sm rounded-xl"
            />
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`p-2 h-11 w-11 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${showFavoritesOnly ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-surface-variant border-transparent text-secondary hover:text-amber-500'}`}
            title="Mostrar apenas favoritos"
          >
            <Icon name="star" filled={showFavoritesOnly} className="text-[20px]" />
          </button>
        </div>
      )}

      {/* Records list */}
      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-64 text-secondary">
            <Icon name="person" className="text-secondary opacity-50 mb-2.5 text-[36px]" />
            <h3 className="font-semibold text-sm">Nenhum Registro</h3>
            <p className="text-xs max-w-[200px] leading-relaxed mt-0.5">
              Os exames calculados e salvos aparecerão listados aqui.
            </p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-48 text-secondary">
            <Icon name="search" className="text-secondary opacity-50 mb-2.5 text-[32px]" />
            <h3 className="font-semibold text-sm">Nenhum resultado</h3>
            <p className="text-xs max-w-[200px] leading-relaxed mt-0.5">
              Não encontramos registros com o termo buscado.
            </p>
          </div>
        ) : (
          filteredRecords.map((rec, index) => {
            const formattedDate = new Date(rec.date).toLocaleDateString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
            });

            return (
              <SwipeToDelete key={`${rec.id}-${index}`} onDelete={() => {
                triggerHaptic(100);
                onDeleteRecord(rec.id);
              }}>
                <div className="bg-surface border border-surface-variant rounded-xl p-4 flex justify-between items-start gap-3 transition-all hover:bg-surface-variant/50">
                  <div className="flex-grow flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary py-0.5 px-2 rounded-md border border-primary/10">
                        {rec.type}
                      </span>
                      <span className="text-xs text-secondary font-semibold flex items-center gap-1">
                        <Icon name="calendar_today" className="text-[11px]" />
                        {formattedDate}
                      </span>
                    </div>
                    <h4 className="font-title-md text-sm font-bold text-on-surface">
                      {rec.patientName}
                    </h4>
                    <p className="text-xs font-semibold text-secondary leading-relaxed">
                      {rec.summary}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <button
                      onClick={() => onToggleFavorite(rec.id)}
                      className={`p-1.5 rounded-xl transition-all cursor-pointer active:scale-90 ${rec.isFavorite ? 'text-amber-500 hover:bg-amber-500/10' : 'text-secondary hover:text-amber-500 hover:bg-surface-variant'}`}
                      title={rec.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                      <Icon name="star" filled={rec.isFavorite} className="text-[18px]" />
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic(100);
                        onDeleteRecord(rec.id);
                      }}
                      className="p-1.5 rounded-xl text-secondary hover:text-error hover:bg-error/10 transition-all cursor-pointer active:scale-90"
                      title="Excluir Registro"
                    >
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  </div>
                </div>
              </SwipeToDelete>
            );
          })
        )}
      </div>
    </div>
  );
}
