import React, { useState } from 'react';
import { BookOpen, Film, DollarSign, Check, ExternalLink, Sparkles } from 'lucide-react';
import { BucketItem } from '../types';

interface VaultViewProps {
  items: BucketItem[];
  onToggleComplete: (item: BucketItem) => void;
  onEdit: (item: BucketItem) => void;
}

export const VaultView: React.FC<VaultViewProps> = ({
  items,
  onToggleComplete,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'reading' | 'watching' | 'budget'>('reading');

  // Filter items
  const readingItems = items.filter((i) => i.categoryId === 'read');
  const watchingItems = items.filter((i) => i.categoryId === 'watch');
  const budgetItems = items.filter(
    (i) => i.budget && i.budget.estimatedCost > 0
  );

  // Financial summary
  const totalEstimated = budgetItems.reduce((acc, i) => acc + (i.budget?.estimatedCost || 0), 0);
  const totalSaved = budgetItems.reduce((acc, i) => acc + (i.budget?.savedAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Vault Category Selector Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-paper-deep rounded-2xl max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('reading')}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'reading'
              ? 'bg-card text-ink shadow-xs'
              : 'text-ink/60 hover:text-ink'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#C05621]" />
          <span>Reading Shelf ({readingItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('watching')}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'watching'
              ? 'bg-card text-ink shadow-xs'
              : 'text-ink/60 hover:text-ink'
          }`}
        >
          <Film className="w-3.5 h-3.5 text-[#BE185D]" />
          <span>Watchlist ({watchingItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'budget'
              ? 'bg-card text-ink shadow-xs'
              : 'text-ink/60 hover:text-ink'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-[#059669]" />
          <span>Ledger</span>
        </button>
      </div>

      {/* Tab 1: Reading Shelf */}
      {activeTab === 'reading' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-journal text-lg font-medium text-ink">
              Personal Library & Reading Intentions
            </h3>
            <span className="text-xs text-ink/60 font-mono">
              {readingItems.filter((i) => i.status === 'completed').length} / {readingItems.length} read
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readingItems.map((book) => {
              const isCompleted = book.status === 'completed';
              return (
                <div
                  key={book.id}
                  className={`bg-card border rounded-2xl p-4 transition-all flex gap-3.5 ${
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
                      {book.subCategory && (
                        <span className="text-[11px] text-[#C05621] font-semibold">
                          {book.subCategory}
                        </span>
                      )}
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
                        onClick={() => onToggleComplete(book)}
                        className={`min-h-[36px] px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-colors ${
                          isCompleted
                            ? 'bg-[#4A6B56]/15 text-[#4A6B56] font-medium'
                            : 'bg-paper border border-ink/15 text-ink/80 hover:bg-ink/10'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isCompleted ? 'Finished' : 'Mark Read'}</span>
                      </button>

                      <button
                        onClick={() => onEdit(book)}
                        className="min-h-[36px] text-xs text-ink/60 hover:text-ink px-2"
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

      {/* Tab 2: Watchlist Theater */}
      {activeTab === 'watching' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-journal text-lg font-medium text-ink">
              Cinema & Screen Screenings
            </h3>
            <span className="text-xs text-ink/60 font-mono">
              {watchingItems.filter((i) => i.status === 'completed').length} / {watchingItems.length} watched
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {watchingItems.map((film) => {
              const isCompleted = film.status === 'completed';
              return (
                <div
                  key={film.id}
                  className={`bg-card border rounded-2xl p-4 transition-all flex flex-col justify-between ${
                    isCompleted
                      ? 'border-ink/10 bg-paper/60 opacity-80'
                      : 'border-ink/12 shadow-xs hover:border-ink/30'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-ink/60">
                      <span className="text-[#BE185D] font-semibold">{film.subCategory || 'Cinema'}</span>
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
                      onClick={() => onToggleComplete(film)}
                      className={`min-h-[36px] px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-colors ${
                        isCompleted
                          ? 'bg-[#4A6B56]/15 text-[#4A6B56] font-medium'
                          : 'bg-paper border border-ink/15 text-ink/80 hover:bg-ink/10'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'Watched' : 'Mark Watched'}</span>
                    </button>
                    <button
                      onClick={() => onEdit(film)}
                      className="min-h-[36px] text-xs text-ink/60 hover:text-ink px-2"
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

      {/* Tab 3: Financial & Savings Ledger */}
      {activeTab === 'budget' && (
        <section className="space-y-4">
          {/* Summary Box */}
          <div className="bg-card border border-ink/10 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                Aspiration Savings Summary
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-2xl font-bold text-ink tabular-nums">
                  ${totalSaved.toLocaleString()}
                </span>
                <span className="text-xs text-ink/60">
                  saved towards ${totalEstimated.toLocaleString()} target
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
                className="bg-card border border-ink/10 rounded-xl p-3.5 hover:border-ink/25 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="text-[11px] text-ink/60">
                    <span>{item.categoryId}</span>
                    {item.subCategory && <span> · {item.subCategory}</span>}
                  </div>
                  <h4 className="font-serif-journal text-base font-medium text-ink">
                    {item.title}
                  </h4>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-semibold text-sm text-ink">
                      ${item.budget?.savedAmount} / ${item.budget?.estimatedCost}
                    </span>
                  </div>
                  <button
                    onClick={() => onEdit(item)}
                    className="min-h-[36px] px-3 py-1 text-xs bg-paper border border-ink/15 rounded-lg text-ink font-medium hover:bg-paper-deep"
                  >
                    Update Funds
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
