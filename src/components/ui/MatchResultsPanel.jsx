import React, { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const fmt = (v) => Math.round(v).toLocaleString('en-US');


/**
 * The shortlist that answers a "find my area" search: ranked communities, what
 * each would cost for the brief, why it matched, and what the search could not
 * measure. It sits alongside the map and never changes the painted data point.
 */
const CONFIDENCE_STYLE = {
  high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-300',
};

// A measured value, printed the way its own data point reads.
const fmtValue = (v, label) => {
  if (v == null) return 'no data';
  const n = Math.abs(v) >= 100 ? Math.round(v).toLocaleString('en-US') : Math.round(v * 100) / 100;
  if (/\(km\)/i.test(label)) return `${n} km`;
  if (/%|share|rate|percent/i.test(label)) return `${n}%`;
  if (/AED/i.test(label)) return `AED ${n}`;
  return `${n}`;
};

const MatchResultsPanel = ({ data, onClose, onRefine, onSelect }) => {
  const [open, setOpen] = useState(true);
  const [showUnscored, setShowUnscored] = useState(false);
  const [expanded, setExpanded] = useState(null);
  if (!data) return null;

  const { results, coverage, priorities, mode, size, budget } = data;
  const top = results.slice(0, 10);
  // The chips repeat the brief in the visitor's own terms, including the trade
  // they chose, because the measures below depend on it.
  const criteria = [
    mode === 'buy' ? 'Buy a home' : mode === 'rent' ? 'Rent a home' : 'Open a business',
    ...(data.businessTypeLabel ? [data.businessTypeLabel] : []),
    budget ? `AED ${fmt(budget)}${mode === 'rent' ? '/yr' : mode === 'business' ? '/mo' : ''}` : 'any budget',
    mode === 'business' ? `${size.label} · ${size.m2} m²` : size.label,
    ...priorities.map((p, i) => `${i + 1}. ${p.label}`),
    ...(data.mustHaves || []).map((m) => `must: ${m.label}`),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      /* A bottom sheet on a phone held upright. A phone turned sideways is wide
         enough to escape `sm:` but far too short for a sheet, so there it moves
         to the side rather than covering the map. Every class is spelled out:
         Tailwind scans this file as text and would not see a built-up name, and
         the underscores become the spaces the media-query grammar requires. */
      className="fixed z-[45] bg-white shadow-2xl flex flex-col overflow-hidden
                 inset-x-0 bottom-0 rounded-t-3xl max-h-[70dvh]
                 [@media_(orientation:landscape)_and_(max-height:500px)]:inset-y-2
                 [@media_(orientation:landscape)_and_(max-height:500px)]:left-auto
                 [@media_(orientation:landscape)_and_(max-height:500px)]:right-2
                 [@media_(orientation:landscape)_and_(max-height:500px)]:w-[330px]
                 [@media_(orientation:landscape)_and_(max-height:500px)]:rounded-2xl
                 [@media_(orientation:landscape)_and_(max-height:500px)]:max-h-none
                 lg:inset-auto lg:right-4 lg:top-24 lg:bottom-28 lg:w-[360px] lg:rounded-2xl lg:max-h-none"
    >
      <div className="px-4 py-3 bg-gradient-to-r from-blue to-azure text-white shrink-0">
        <div className="lg:hidden [@media_(orientation:landscape)_and_(max-height:500px)]:hidden mx-auto mb-2 h-1.5 w-10 rounded-full bg-white/40" />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Your matches</div>
            <div className="text-lg font-bold leading-tight">
              {results.length > 10 ? `Top 10 of ${results.length} areas` : `${results.length} ${results.length === 1 ? 'area fits' : 'areas fit'} your brief`}
            </div>
            {results.length > 10 && <div className="text-[11px] text-white/75">ranked by how well they match; the map shows these ten</div>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setOpen((v) => !v)} className="lg:hidden w-11 h-11 inline-flex items-center justify-center rounded-full bg-white/15 touch-manipulation" aria-label={open ? 'Collapse' : 'Expand'}>
              {open ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button onClick={onRefine} className="w-11 h-11 inline-flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 touch-manipulation" aria-label="Refine search" title="Refine search">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-11 h-11 inline-flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 touch-manipulation" aria-label="Close matches">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {criteria.map((c) => (
            <span key={c} className="text-[10px] bg-white/15 rounded-full px-2 py-0.5">{c}</span>
          ))}
        </div>
      </div>

      {open && (
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-4 py-2 text-[11px] text-gray-600 bg-gray-50 border-b border-gray-200 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-azure shrink-0 mt-0.5" />
            <span>
              Scored <b>{coverage.scored}</b> of {coverage.total} communities.
              {coverage.overBudget > 0 && <> {coverage.overBudget} over budget.</>}
              {coverage.failedMustHave > 0 && <> {coverage.failedMustHave} failed a must-have.</>}
              {coverage.withoutCost > 0 && <> {coverage.withoutCost} have no {mode === 'buy' ? 'recorded sales' : 'registered rents'}.</>}
              {coverage.unscored > 0 && <> {coverage.unscored} lacked data for your priorities.</>}
            </span>
          </div>

          {top.length === 0 && (
            <div className="p-5 text-sm text-gray-600">
              Nothing fits that budget in the communities with {mode === 'buy' ? 'recorded sales' : 'registered rents'}.
              Try a larger budget, a smaller {mode === 'business' ? 'space' : 'home'}, or drop a must-have.
            </div>
          )}

          <ol className="divide-y divide-gray-100">
            {top.map((r, i) => (
              <li key={r.code}>
                <button onClick={() => onSelect(r)} className="w-full text-left px-4 py-3 min-h-[48px] touch-manipulation hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-blue text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-blue text-sm truncate">{r.name}</span>
                        {r.score != null && <span className="text-xs font-bold text-azure shrink-0">{r.score}% match</span>}
                      </span>
                      <span className="block h-1 rounded-full bg-gray-200 mt-1 mb-1.5">
                        <span className="block h-1 rounded-full bg-azure" style={{ width: `${r.score ?? 0}%` }} />
                      </span>
                      <span className="block text-xs text-gray-700">{r.costText}</span>
                      <span className="block text-[11px] text-gray-600 mt-0.5">{r.reasons.join(' · ')}</span>
                      <span className="block text-[11px] text-orange mt-0.5">{r.caveat}</span>
                      <span className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[10px] rounded-full border px-1.5 py-0.5 ${CONFIDENCE_STYLE[r.confidence] || CONFIDENCE_STYLE.low}`}>
                          {r.confidence} confidence
                        </span>
                        <span className="text-[10px] text-gray-500 truncate">{r.evidence?.text}</span>
                      </span>
                    </span>
                  </div>
                </button>
                <div className="px-4 pb-3 -mt-1">
                  <button
                    onClick={() => setExpanded(expanded === r.code ? null : r.code)}
                    aria-expanded={expanded === r.code}
                    className="text-[11px] font-semibold text-azure hover:text-azure-dark min-h-[40px] inline-flex items-center touch-manipulation"
                  >
                    {expanded === r.code ? 'Hide the numbers' : 'See the numbers behind this score'}
                  </button>
                  {expanded === r.code && (
                    <div className="mt-2 space-y-2.5">
                      {r.confidence !== 'high' && (
                        <p className="text-[11px] text-gray-600">
                          {r.confidenceText}{r.rawScore != null && r.rawScore !== r.score ? ` (${r.rawScore}% before the adjustment)` : ''}.
                        </p>
                      )}
                      {r.parts.map((p) => (
                        <div key={p.id} className="rounded-lg border border-gray-200 overflow-hidden">
                          <div className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50">
                            <span className="text-[11px] font-semibold text-blue">
                              {p.rank}. {p.label}
                              <span className="font-normal text-gray-500"> · counts {p.weight}×</span>
                            </span>
                            <span className="text-[11px] font-bold text-azure">{p.score == null ? 'no data' : `${Math.round(p.score)}%`}</span>
                          </div>
                          <ul className="divide-y divide-gray-100">
                            {p.detail.map((d) => (
                              <li key={d.id} className="px-2.5 py-1.5">
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="text-[11px] text-gray-700">{d.label}</span>
                                  <span className="text-[11px] font-semibold text-blue whitespace-nowrap">{fmtValue(d.value, d.label)}</span>
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {d.percentile != null
                                    ? `${d.percentile}th percentile of ${d.of} communities · ${d.betterWhen} is better`
                                    : 'not published for this community'}
                                </div>
                                {d.source && <div className="text-[10px] text-gray-400 truncate">{d.source}{d.period ? ` · ${d.period}` : ''}</div>}
                                {d.note && <div className="text-[10px] text-orange">{d.note}</div>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {coverage.unscored > 0 && (
            <div className="px-4 py-3 border-t border-gray-200">
              <button onClick={() => setShowUnscored((v) => !v)} className="text-[11px] font-semibold text-gray-600 hover:text-blue min-h-[40px] inline-flex items-center touch-manipulation">
                {showUnscored ? 'Hide' : 'Show'} the {coverage.unscored} communities that could not be scored
              </button>
              {showUnscored && (
                <ul className="mt-1.5 space-y-0.5">
                  {data.unscored.slice(0, 40).map((u) => (
                    <li key={u.code} className="text-[11px] text-gray-500">{u.name} — {u.reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="px-4 py-3 text-[10px] text-gray-500 border-t border-gray-200">
            Matches are built from recorded Dubai Land Department transactions and the published community data points,
            using the measures that apply to {mode === 'buy' ? 'buying' : mode === 'rent' ? 'renting' : 'trading'} — not a single blended rating.
            Scores compare communities with each other, not against an absolute standard. Tap an area to see its price history.
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MatchResultsPanel;
