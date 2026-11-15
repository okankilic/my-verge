import React, { useEffect, useState } from 'react';
import { Bell, Volume2, RefreshCw, Sparkles, X } from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import { ThemePreference } from '../services/storage';
import { DEFAULT_CATEGORIES } from '../data/categories';
import {
  playChimeSound,
  getNotificationPermission,
  requestNotificationPermission,
} from '../services/notifications';
import { deleteAttachmentBlobs } from '../services/attachments';
import { notify } from '../services/dialogs';
import { renderCategoryIcon, categoryColor, categoryLabel } from '../utils/categoryIcons';
import { CURRENCIES } from '../data/currencies';
import { currencyName, currencySymbol } from '../utils/expenses';
import { InlineConfirm } from './InlineConfirm';
import { LOCALES, LOCALE_NAMES, LanguagePreference, t } from '../i18n';

interface SettingsViewProps {
  items: BucketItem[];
  categories: CategoryDefinition[];
  onReloadData: (items: BucketItem[], categories: CategoryDefinition[]) => void;
  onAddSamples: () => void;
  onCategoriesChange: (categories: CategoryDefinition[]) => void;
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  language: LanguagePreference;
  onLanguageChange: (language: LanguagePreference) => void;
  defaultCurrency: string;
  onDefaultCurrencyChange: (code: string) => void;
  onNotificationsEnabled: () => void;
  onClose: () => void;
}

const THEME_OPTIONS: { value: ThemePreference; label: 'settings.themeLight' | 'settings.themeDark' | 'settings.themeSystem' }[] = [
  { value: 'light', label: 'settings.themeLight' },
  { value: 'dark', label: 'settings.themeDark' },
  { value: 'system', label: 'settings.themeSystem' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  items,
  categories,
  onReloadData,
  onAddSamples,
  onCategoriesChange,
  theme,
  onThemeChange,
  language,
  onLanguageChange,
  defaultCurrency,
  onDefaultCurrencyChange,
  onNotificationsEnabled,
  onClose,
}) => {
  const [notificationState, setNotificationState] = useState<string>('unsupported');
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  useEffect(() => {
    getNotificationPermission().then(setNotificationState);
  }, []);

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotificationState(res);
    if (res === 'granted') onNotificationsEnabled();
  };

  // Drop attachment blobs that the incoming items no longer reference
  const deleteOrphanedBlobs = (nextItems: BucketItem[]) => {
    const keep = new Set(nextItems.flatMap((i) => i.attachments?.map((a) => a.id) ?? []));
    const orphaned = items
      .flatMap((i) => i.attachments?.map((a) => a.id) ?? [])
      .filter((id) => !keep.has(id));
    deleteAttachmentBlobs(orphaned).catch((err) =>
      console.error('Failed to delete attachments:', err)
    );
  };

  // Clears every plan (and its files) and restores the default categories
  const handleReset = () => {
    deleteOrphanedBlobs([]);
    onReloadData([], DEFAULT_CATEGORIES);
    setIsConfirmingReset(false);
    notify(t('settings.resetDone'), 'success');
  };

  return (
    <>
      <div className="pl-4 pr-1.5 py-1 border-b border-ink/10 flex items-center justify-between shrink-0">
        <span id="settings-sheet-title" className="font-serif-journal text-base text-ink">
          {t('settings.title')}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('actions.close')}
          title={t('actions.close')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-ink/70 hover:text-ink hover:bg-ink/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Appearance */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4 flex items-center justify-between gap-3">
            <h4 className="text-xs font-semibold text-ink">{t('settings.appearance')}</h4>
            <div role="radiogroup" aria-label={t('settings.appearance')} className="flex items-center gap-1 p-1 bg-paper rounded-xl">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={theme === opt.value}
                  onClick={() => onThemeChange(opt.value)}
                  className={`min-h-[44px] px-3 text-xs rounded-lg transition-colors ${
                    theme === opt.value
                      ? 'bg-ink text-paper font-semibold shadow-2xs'
                      : 'text-ink/70 hover:text-ink'
                  }`}
                >
                  {t(opt.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Language: System follows the device; each language is named in itself */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4 flex items-center justify-between gap-3">
            <h4 className="text-xs font-semibold text-ink">{t('settings.language')}</h4>
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as LanguagePreference)}
              aria-label={t('settings.language')}
              className="shrink-0 min-h-[44px] px-3 text-xs bg-paper border border-ink/15 rounded-xl text-ink focus:outline-none focus:border-ink"
            >
              <option value="system">{t('settings.languageSystem')}</option>
              {LOCALES.map((code) => (
                <option key={code} value={code} lang={code}>
                  {LOCALE_NAMES[code]}
                </option>
              ))}
            </select>
          </div>

          {/* Currency: what new wishes start with; each wish can change its own */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-ink">{t('form.currency')}</h4>
              <p className="text-[11px] text-ink/60 mt-0.5">
                {t('settings.currencyHint')}
              </p>
            </div>
            <select
              value={defaultCurrency}
              onChange={(e) => onDefaultCurrencyChange(e.target.value)}
              aria-label={t('settings.currencyLabel')}
              className="shrink-0 min-h-[44px] px-3 text-xs bg-paper border border-ink/15 rounded-xl text-ink focus:outline-none focus:border-ink"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {currencySymbol(c.code)} · {currencyName(c.code, c.label)}
                </option>
              ))}
            </select>
          </div>

          {/* Vault: which categories' plans show there */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4">
            <h4 className="text-xs font-semibold text-ink">{t('settings.vault')}</h4>
            <p className="text-[11px] text-ink/60 mt-0.5">
              {t('settings.vaultHint')}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isOn = Boolean(cat.keepInVault);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={isOn}
                    onClick={() =>
                      onCategoriesChange(
                        categories.map((c) => (c.id === cat.id ? { ...c, keepInVault: !isOn } : c))
                      )
                    }
                    className={`min-h-[44px] px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                      isOn
                        ? 'border-ink bg-ink text-paper font-semibold'
                        : 'border-ink/15 bg-paper text-ink/75'
                    }`}
                  >
                    <span style={isOn ? undefined : { color: categoryColor(cat.accentColor) }}>
                      {renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                    </span>
                    <span>{categoryLabel(cat)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-ink">{t('settings.alerts')}</h4>
              <p className="text-[11px] text-ink/60 mt-0.5">
                {notificationState === 'granted'
                  ? t('settings.alertsOn')
                  : notificationState === 'denied'
                    ? t('alerts.denied')
                    : notificationState === 'unsupported'
                      ? t('settings.alertsUnsupported')
                      : t('settings.alertsHint')}
              </p>
            </div>
            {notificationState === 'default' && (
              <button
                onClick={handleEnableNotifications}
                className="min-h-[44px] px-3.5 py-1.5 text-xs font-semibold bg-ink text-paper rounded-xl hover:bg-ink/85 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{t('actions.enable')}</span>
              </button>
            )}
          </div>

          {/* Sound Chime Preview */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-ink">{t('settings.chime')}</h4>
              <p className="text-[11px] text-ink/60 mt-0.5">
                {t('settings.chimeHint')}
              </p>
            </div>
            <button
              onClick={() => playChimeSound()}
              className="min-h-[44px] px-3.5 py-1.5 text-xs font-medium border border-ink/20 rounded-xl hover:bg-paper flex items-center gap-1.5 shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5 text-accent" />
              <span>{t('actions.test')}</span>
            </button>
          </div>

          {/* Sample plans */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-ink">{t('settings.samplesTitle')}</h4>
              <p className="text-[11px] text-ink/60 mt-0.5">
                {t('settings.samplesHint')}
              </p>
            </div>
            <button
              onClick={onAddSamples}
              aria-label={t('empty.samplesLabel')}
              className="min-h-[44px] px-3.5 py-1.5 text-xs font-medium border border-ink/20 rounded-xl hover:bg-paper flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>{t('actions.samples')}</span>
            </button>
          </div>

          {/* Reset: start over with no plans */}
          <div className="pt-2">
            {isConfirmingReset ? (
              <div className="bg-card border border-red-500/30 rounded-2xl p-4">
                <h4 className="text-xs font-semibold text-ink">{t('settings.resetTitle')}</h4>
                <InlineConfirm
                  message={t('settings.resetMessage')}
                  confirmLabel={t('actions.reset')}
                  onConfirm={handleReset}
                  onCancel={() => setIsConfirmingReset(false)}
                />
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingReset(true)}
                className="w-full min-h-[44px] px-4 py-2 text-xs text-danger/80 hover:text-danger border border-red-500/30 rounded-xl hover:bg-red-500/10 flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('actions.reset')}</span>
              </button>
            )}
          </div>

          <p className="pt-2 text-center font-mono-journal text-[11px] text-ink/50">
            {t('settings.version', { version: __APP_VERSION__ })}
          </p>
        </div>
      </div>
    </>
  );
};
