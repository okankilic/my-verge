import React from 'react';
import { BookOpen, Check, Star } from 'lucide-react';
import { renderCategoryIcon } from '../utils/categoryIcons';
import { BucketItem, CategoryDefinition } from '../types';

interface VaultViewProps {
  items: BucketItem[];
  categories: CategoryDefinition[];
  onSelect: (item: BucketItem) => void;
  onToggleComplete: (item: BucketItem) => void;
  onEdit: (item: BucketItem) => void;
}

const formatMoney = (amount: number | undefined, currency = '$') =>
  `${currency || '$'}${(amount ?? 0).toLocaleString()}`;

const isShelved = (i: BucketItem) =>
  i.categoryId === 'read' || i.categoryId === 'watch' || (i.budget?.estimatedCost ?? 0) > 0;

// Active wishes appear on their shelf; finished ones only while kept, and then on the Kept shelf too.
// App.tsx uses this for the category ribbon counts, so they match what the Vault lists.
export const isInVault = (i: BucketItem) =>
  (i.status === 'active' && isShelved(i)) || (i.status === 'completed' && Boolean(i.keptInVault));

const EmptyShelf: React.FC<{ title: string; hint: string }> = ({ title, hint }) => (
  <div className="p-8 text-center bg-card border border-ink/10 rounded-xl">
    <p className="font-serif-journal text-base text-ink/70">{title}</p>
    <p className="text-xs text-ink/50 mt-1 max-w-sm mx-auto">{hint}</p>
  </div>
);

export const VaultView: React.FC<VaultViewProps> = ({
  items,
  categories,
  onSelect,
  onToggleComplete,
  onEdit,
}) => {
  // Archived wishes, and finished ones the user didn't keep, stay out of the Vault
  const visibleItems = items.filter(
    (i) => i.status === 'active' || (i.status === 'completed' && i.keptInVault)
  );
  const keptItems = visibleItems
    .filter((i) => i.status === 'completed')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  const readingItems = visibleItems.filter((i) => i.categoryId === 'read');
  const watchingItems = visibleItems.filter((i) => i.categoryId === 'watch');
  const budgetItems = visibleItems.filter(
    (i) => i.budget && i.budget.estimatedCost > 0
  );

  const isEmpty =
    readingItems.length + watchingItems.length + budgetItems.length + keptItems.length === 0;

  // Financial summary
  const totalEstimated = budgetItems.reduce((acc, i) => acc + (i.budget?.estimatedCost || 0), 0);
  const totalSaved = budgetItems.reduce((acc, i) => acc + (i.budget?.savedAmount || 0), 0);

  // Inner buttons must not also open the detail drawer
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div className="space-y-8">
      {isEmpty && (
        <EmptyShelf
          title="Your Vault is empty"
          hint="Read and Watch wishes, wishes with a budget, and finished wishes you keep will show up here."
        />
      )}

      {/* Reading Shelf */}
      {readingItems.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif-journal text-lg font-medium text-ink">
              Personal Library & Reading Wishes
            </h3>
            <span className="shrink-0 text-xs text-ink/60 font-mono">
              {readingItems.filter((i) => i.status === 'completed').length} / {readingItems.length} read
            </span>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readingItems.map((book) => {
              const isCompleted = book.status === 'completed';
              return (
                <div
                  key={book.id}
                  onClick={() => onSelect(book)}
                  className={`bg-card border rounded-2xl p-4 transition-all flex gap-3.5 cursor-pointer ${
                    isCompleted
                      ? 'border-ink/10 bg-paper/60 opacity-80'
                      : 'border-ink/12 shadow-xs hover:border-ink/30'
                  }`}
                >
                  {/* Book Spine / Cover preview */}
                  <div className="w-20 sm:w-24 shrink-0 rounded-lg overflow-hidden bg-paper-deep border border-ink/10 aspect-[3/4]">
                    {book.photos && book.photos.length > 0 ? (
                      <img
                        src={book.photos[0]}
                        alt={book.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-ink/30">
                        <BookOpen className="w-6 h-6 stroke-[1.5]" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4
                        className={`font-serif-journal text-base font-medium text-ink mt-0.5 line-clamp-2 ${
                          isCompleted ? 'line-through text-ink/50' : ''
                        }`}
                      >
                        {book.title}
                      </h4>
                      {book.mediaMeta?.authorOrCreator && (
                        <p className="text-xs text-ink/70 italic mt-0.5">
                          {book.mediaMeta.authorOrCreator}
                        </p>
                      )}
                      {book.mediaMeta?.formatOrEdition && (
                        <p className="text-[11px] text-ink/50 mt-0.5">
                          {book.mediaMeta.formatOrEdition}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-ink/8 mt-2">
                      <button
                        onClick={stop(() => onToggleComplete(book))}
                        className={`min-h-[44px] px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-colors ${
                          isCompleted
                            ? 'bg-[#4A6B56]/15 text-[#4A6B56] font-medium'
                            : 'bg-paper border border-ink/15 text-ink/80 hover:bg-ink/10'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isCompleted ? 'Finished' : 'Finish'}</span>
                      </button>

                      <button
                        onClick={stop(() => onEdit(book))}
                        className="min-h-[44px] min-w-[44px] text-xs text-ink/60 hover:text-ink px-2"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Watchlist Theater */}
      {watchingItems.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif-journal text-lg font-medium text-ink">
              Cinema & Screen Screenings
            </h3>
            <span className="shrink-0 text-xs text-ink/60 font-mono">
              {watchingItems.filter((i) => i.status === 'completed').length} / {watchingItems.length} watched
            </span>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {watchingItems.map((film) => {
              const isCompleted = film.status === 'completed';
              return (
                <div
                  key={film.id}
                  onClick={() => onSelect(film)}
                  className={`bg-card border rounded-2xl p-4 transition-all flex flex-col justify-between cursor-pointer ${
                    isCompleted
                      ? 'border-ink/10 bg-paper/60 opacity-80'
                      : 'border-ink/12 shadow-xs hover:border-ink/30'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-ink/60">
                      <span className="text-[#BE185D] font-semibold">Cinema</span>
                      {film.mediaMeta?.formatOrEdition && (
                        <span className="font-mono text-[11px]">{film.mediaMeta.formatOrEdition}</span>
                      )}
                    </div>
                    <h4
                      className={`font-serif-journal text-base font-medium text-ink ${
                        isCompleted ? 'line-through text-ink/50' : ''
                      }`}
                    >
                      {film.title}
                    </h4>
                    {film.mediaMeta?.authorOrCreator && (
                      <p className="text-xs text-ink/70 italic">
                        Directed by {film.mediaMeta.authorOrCreator}
                      </p>
                    )}
                    {film.description && (
                      <p className="text-xs text-ink/75 line-clamp-2 leading-relaxed">
                        {film.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-ink/8 mt-3">
                    <button
                      onClick={stop(() => onToggleComplete(film))}
                      className={`min-h-[44px] px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-colors ${
                        isCompleted
                          ? 'bg-[#4A6B56]/15 text-[#4A6B56] font-medium'
                          : 'bg-paper border border-ink/15 text-ink/80 hover:bg-ink/10'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'Watched' : 'Done'}</span>
                    </button>
                    <button
                      onClick={stop(() => onEdit(film))}
                      className="min-h-[44px] min-w-[44px] text-xs text-ink/60 hover:text-ink px-2"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Financial & Savings Ledger */}
      {budgetItems.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif-journal text-lg font-medium text-ink">Ledger</h3>
            <span className="shrink-0 text-xs text-ink/60 font-mono">{budgetItems.length} budgeted</span>
          </div>

          {/* Summary Box */}
          <div className="bg-card border border-ink/10 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                Aspiration Savings Summary
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-2xl font-bold text-ink tabular-nums">
                  {formatMoney(totalSaved)}
                </span>
                <span className="text-xs text-ink/60">
                  saved towards {formatMoney(totalEstimated)} target
                </span>
              </div>
            </div>

            <div className="w-full sm:w-48">
              <div className="flex justify-between text-xs text-ink/70 mb-1 font-mono">
                <span>Funded</span>
                <span>
                  {totalEstimated > 0 ? Math.round((totalSaved / totalEstimated) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-paper border border-ink/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#059669] transition-all"
                  style={{
                    width: `${
                      totalEstimated > 0
                        ? Math.min(100, Math.round((totalSaved / totalEstimated) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>


          <div className="space-y-2.5">
            {budgetItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className="bg-card border border-ink/10 rounded-xl p-3.5 hover:border-ink/25 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-[11px] text-ink/60">
                    <span>{categories.find((c) => c.id === item.categoryId)?.verb || item.categoryId}</span>
                  </div>
                  <h4 className="font-serif-journal text-base font-medium text-ink">
                    {item.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <span className="font-mono font-semibold text-sm text-ink tabular-nums">
                    {formatMoney(item.budget!.savedAmount, item.budget!.currency)} /{' '}
                    {formatMoney(item.budget!.estimatedCost, item.budget!.currency)}
                  </span>
                  <button
                    onClick={stop(() => onEdit(item))}
                    className="min-h-[44px] px-3 py-1 text-xs bg-paper border border-ink/15 rounded-lg text-ink font-medium hover:bg-paper-deep"
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Kept finished wishes, from any category */}
      {keptItems.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif-journal text-lg font-medium text-ink">Kept</h3>
            <span className="shrink-0 text-xs text-ink/60 font-mono">{keptItems.length} kept</span>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {keptItems.map((item) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="bg-card border border-ink/12 rounded-2xl p-3 shadow-xs hover:border-ink/30 transition-all flex gap-3 cursor-pointer"
                >
                  <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-paper-deep border border-ink/10 flex items-center justify-center">
                    {item.photos && item.photos.length > 0 ? (
                      <img
                        src={item.photos[0]}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span style={{ color: cat?.accentColor }}>
                        {renderCategoryIcon(cat?.icon ?? 'Sparkles', 'w-6 h-6')}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-ink/60">{cat?.verb || item.categoryId}</div>
                    <h4 className="font-serif-journal text-base font-medium text-ink line-clamp-2">
                      {item.title}
                    </h4>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-ink/55">
                      {item.completionRating ? (
                        <span
                          className="flex items-center gap-0.5"
                          aria-label={`Rated ${item.completionRating} of 5`}
                        >
                          {Array.from({ length: item.completionRating }, (_, n) => (
                            <Star key={n} className="w-3 h-3 text-[#B45309] fill-[#B45309]" />
                          ))}
                        </span>
                      ) : null}
                      {item.completedAt && (
                        <span className="font-mono">
                          {new Date(item.completedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
