import { AppSettings } from '../types';
import Icon from './Icon';

interface SettingsPanelProps {
  settings: AppSettings;
  onChangeSettings: (settings: AppSettings) => void;
  onClose: () => void;
}

export default function SettingsPanel({ settings, onChangeSettings, onClose }: SettingsPanelProps) {
  return (
    <div className="flex flex-col h-full bg-surface text-on-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-surface-variant">
        <div className="flex items-center gap-2">
          <Icon name="settings" className="text-primary text-[20px]" />
          <h2 className="font-title-md font-bold text-lg">Preferências e Referências</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-surface-variant text-secondary transition-colors cursor-pointer"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>

      {/* Settings list */}
      <div className="flex-grow overflow-y-auto p-5 flex flex-col gap-6">
        {/* Theme Preference */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5 pl-0.5">
            <Icon name="palette" className="text-[14px]" /> Visual
          </h3>
          <div className="bg-surface border border-surface-variant rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-on-surface">Modo de Exibição</span>
              <span className="text-xs text-secondary">Alterne entre os modos claro e escuro.</span>
            </div>
            <div className="flex bg-surface-variant/50 p-1 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => onChangeSettings({ ...settings, theme: 'light' })}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  settings.theme === 'light' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-on-surface'
                }`}
              >
                Claro
              </button>
              <button
                onClick={() => onChangeSettings({ ...settings, theme: 'dark' })}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  settings.theme === 'dark' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-on-surface'
                }`}
              >
                Escuro
              </button>
              <button
                onClick={() => onChangeSettings({ ...settings, theme: 'system' })}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  settings.theme === 'system' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-on-surface'
                }`}
              >
                Sistema
              </button>
            </div>
          </div>
        </div>

        {/* Calculation Defaults */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5 pl-0.5">
            <Icon name="tune" className="text-[14px]" /> Parâmetros Padrão
          </h3>
          <div className="bg-surface border border-surface-variant rounded-xl p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-on-surface">Ciclo Menstrual (dias)</span>
                <span className="text-xs text-secondary">Usado como padrão no cálculo por DUM.</span>
              </div>
              <input
                type="number"
                min="20"
                max="45"
                value={settings.defaultCycleLength}
                onChange={(e) => onChangeSettings({ ...settings, defaultCycleLength: parseInt(e.target.value) || 28 })}
                className="w-16 h-10 px-2 rounded-xl border border-surface-variant bg-surface text-center text-sm font-bold text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5 pl-0.5">
            <Icon name="keyboard" className="text-[14px]" /> Atalhos do Teclado
          </h3>
          <div className="bg-surface border border-surface-variant rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center pb-2 border-b border-surface-variant/50">
              <span className="text-sm font-medium text-on-surface">Zerar formulário</span>
              <div className="flex items-center gap-1 font-mono text-xs text-secondary bg-surface-variant/50 px-2 py-1 rounded-md">
                <span>Ctrl/Cmd</span>
                <span>+</span>
                <span>L</span>
              </div>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-surface-variant/50">
              <span className="text-sm font-medium text-on-surface">Salvar no histórico</span>
              <div className="flex items-center gap-1 font-mono text-xs text-secondary bg-surface-variant/50 px-2 py-1 rounded-md">
                <span>Ctrl/Cmd</span>
                <span>+</span>
                <span>S</span>
              </div>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-surface-variant/50">
              <span className="text-sm font-medium text-on-surface">Alternar histórico</span>
              <div className="flex items-center gap-1 font-mono text-xs text-secondary bg-surface-variant/50 px-2 py-1 rounded-md">
                <span>Ctrl/Cmd</span>
                <span>+</span>
                <span>H</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-on-surface">Alternar configurações</span>
              <div className="flex items-center gap-1 font-mono text-xs text-secondary bg-surface-variant/50 px-2 py-1 rounded-md">
                <span>Ctrl/Cmd</span>
                <span>+</span>
                <span>/</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scientific References */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5 pl-0.5">
            <Icon name="menu_book" className="text-[14px]" /> Referências Científicas
          </h3>
          <div className="bg-surface border border-surface-variant rounded-xl p-4 flex flex-col gap-3.5 text-xs leading-relaxed text-secondary">
            <div className="border-b border-surface-variant pb-2.5">
              <span className="font-semibold text-on-surface block mb-0.5">Fórmula de Hadlock (Peso Fetal)</span>
              Hadlock FP, et al. Estimating fetal weight with the use of head, body, and femur measurements - a prospective study. Am J Obstet Gynecol. 1985 Feb 1;151(3):333-7.
            </div>
            <div className="border-b border-surface-variant pb-2.5">
              <span className="font-semibold text-on-surface block mb-0.5">Curvas de Percentil (Barcelona)</span>
              Fetal Medicine Barcelona (FMB) Reference standards for fetal growth and weight. Gratacós E, et al. Medicina Fetal Barcelona.
            </div>
            <div className="border-b border-surface-variant pb-2.5">
              <span className="font-semibold text-on-surface block mb-0.5">Avaliação de Líquido Amniótico (ILA)</span>
              Phelan JP, et al. Amniotic fluid volume assessment with the four-quadrant technique at 36-42 weeks' gestation. J Reprod Med. 1987 Jul;32(7):540-2.
            </div>
            <div>
              <span className="font-semibold text-on-surface block mb-0.5">Idade Gestacional por CCN</span>
              Hadlock FP, et al. Fetal crown-rump length: relation to menstrual age and projection of expected date of confinement. Radiology. 1982.
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5 pl-0.5">
            <Icon name="balance" className="text-[14px]" /> Aviso de Isenção de Responsabilidade
          </h3>
          <div className="bg-error/5 border border-error/10 p-4 rounded-2xl text-xs leading-relaxed text-error flex gap-2.5 items-start">
            <Icon name="info" className="shrink-0 mt-0.5 text-[16px]" />
            <p>
              Esta ferramenta destina-se <strong>exclusivamente como apoio à decisão clínica por profissionais de saúde qualificados</strong>. 
              As decisões médicas e condutas obstétricas devem ser individualizadas e baseadas na avaliação clínica soberana de cada caso. 
              O desenvolvedor não se responsabiliza por quaisquer decisões tomadas isoladamente com base nestes cálculos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
