import React, { useEffect, useState } from 'react';
import { X, ArrowRight, ArrowLeft, Home, KeyRound, Store, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  MODES, BUSINESS_TYPES, GROUP_ORDER,
  sizesFor, prioritiesFor, mustHaveFor, defaultSizeId, groupLabel, findMatches,
} from '../../services/areaMatch';

const MODE_ICON = { buy: Home, rent: KeyRound, business: Store };
const MAX_PRIORITIES = 3;
const ORDINAL = ['1st', '2nd', '3rd'];

/**
 * Three questions — what are you doing, what can you spend, what matters —
 * answered against the published community data.
 *
 * The questions themselves change with the answer to the first one: a buyer is
 * asked about bedrooms and resale, a business about floor space and customers,
 * and a clinic about unmet demand where a café is asked about footfall.
 * Nothing here touches the data-point layers; it only reads them through
 * areaMatch.
 */
const FindMyAreaWizard = ({ isOpen, onClose, onResults }) => {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState('buy');
  const [budget, setBudget] = useState('');
  const [sizeId, setSizeId] = useState('2bed');
  const [businessType, setBusinessType] = useState('restaurant');
  const [priorityIds, setPriorityIds] = useState([]);
  const [mustHaves, setMustHaves] = useState({});

  // Reopening starts at the first question again, with the previous answers
  // still selected, so the wizard never opens half-way through an old search.
  useEffect(() => { if (isOpen) setStep(1); }, [isOpen]);

  if (!isOpen) return null;

  const type = mode === 'business' ? businessType : null;
  const modeCfg = MODES.find((m) => m.id === mode);
  const sizes = sizesFor(mode);
  const budgetNumber = Number(String(budget).replace(/[^0-9.]/g, '')) || null;
  const priorities = prioritiesFor(mode, type);
  const canContinue = step === 1 ? Boolean(mode)
    : step === 2 ? (mode === 'business' ? true : budgetNumber > 0)
      : priorityIds.length > 0;

  // A pick that pulls the ranking the opposite way to one already chosen is
  // blocked rather than quietly cancelling it out.
  const blockedBy = (p) => priorityIds
    .map((id) => priorities.find((x) => x.id === id))
    .filter(Boolean)
    .find((sel) => (sel.conflictsWith || []).includes(p.id) || (p.conflictsWith || []).includes(sel.id));

  const togglePriority = (id) => setPriorityIds((cur) => {
    if (cur.includes(id)) {
      setMustHaves((m) => { const next = { ...m }; delete next[id]; return next; });
      return cur.filter((x) => x !== id);
    }
    return cur.length >= MAX_PRIORITIES ? cur : [...cur, id];
  });
  const setMustHave = (id, value) => setMustHaves((m) => ({ ...m, [id]: m[id] === value ? null : value }));

  // Changing what you are doing changes the questions, so anything that no
  // longer applies is dropped instead of being carried over silently.
  const keepValid = (nextMode, nextType) => {
    const allowed = prioritiesFor(nextMode, nextType).map((p) => p.id);
    setPriorityIds((cur) => cur.filter((id) => allowed.includes(id)));
    setMustHaves({});
    setSizeId((cur) => (sizesFor(nextMode).some((s) => s.id === cur) ? cur : defaultSizeId(nextMode, nextType)));
  };

  const changeMode = (id) => {
    if (id === mode) return;
    setMode(id);
    // The budget means a different thing in each mode — a purchase price, a
    // year's rent, a month's rent — so it is cleared rather than reinterpreted.
    setBudget('');
    setSizeId(defaultSizeId(id, id === 'business' ? businessType : null));
    keepValid(id, id === 'business' ? businessType : null);
  };

  const changeBusinessType = (id) => {
    setBusinessType(id);
    setSizeId(defaultSizeId('business', id));
    keepValid('business', id);
  };

  const run = () => {
    const data = findMatches({ mode, budget: budgetNumber, sizeId, priorityIds, mustHaves, businessType: type });
    onResults(data);
    onClose();
  };

  // 48px clears both platform minimums at once — Apple asks for 44pt, Android's
  // Material for 48dp. `touch-manipulation` drops the 300ms double-tap-to-zoom
  // wait that both mobile browsers otherwise add.
  const chip = (active) =>
    `rounded-xl border px-3 py-2.5 text-sm text-left min-h-[48px] touch-manipulation transition-colors ${
      active ? 'bg-azure text-white border-azure' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    }`;

  const groups = GROUP_ORDER
    .map((g) => ({ id: g, label: groupLabel(g, mode), items: priorities.filter((p) => p.group === g) }))
    .filter((g) => g.items.length);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60]" onClick={onClose} aria-hidden="true" />
      {/* Centred with flex, not a transform: framer-motion writes its own
          inline transform, which would cancel a translate-based centring. */}
      <div className="fixed inset-0 z-[61] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        role="dialog"
        aria-label="Find my area"
        className="pointer-events-auto bg-white shadow-2xl flex flex-col w-full max-h-[92dvh]
                   rounded-t-3xl sm:w-[560px] sm:rounded-2xl sm:max-h-[86vh]"
      >
        {/* header */}
        <div className="px-5 sm:px-6 pt-2.5 sm:pt-5 pb-4 bg-gradient-to-r from-blue to-azure text-white rounded-t-3xl sm:rounded-t-2xl">
          <div className="sm:hidden mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/40" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Step {step} of 3</div>
              <h2 className="text-xl font-bold leading-tight">
                {step === 1 ? 'What are you looking to do?' : step === 2 ? 'What can you spend?' : 'What matters most?'}
              </h2>
              {step > 1 && (
                <div className="text-[11px] text-white/75 mt-0.5">
                  {modeCfg.label}{type ? ` · ${(BUSINESS_TYPES.find((b) => b.id === type) || {}).label}` : ''}
                </div>
              )}
            </div>
            <button onClick={onClose} aria-label="Close" className="shrink-0 w-12 h-12 -mr-2 inline-flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 touch-manipulation transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-1.5 mt-3">
            {[1, 2, 3].map((n) => (
              <span key={n} className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4">
          {step === 1 && (
            <div className="grid gap-2.5">
              {MODES.map((m) => {
                const Icon = MODE_ICON[m.id];
                return (
                  <button key={m.id} onClick={() => changeMode(m.id)} className={`${chip(mode === m.id)} flex items-center gap-3`}>
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{m.label}</span>
                  </button>
                );
              })}
              {mode === 'business' && (
                <div className="mt-2">
                  <div className="text-xs font-semibold text-gray-700 mb-1.5">What kind of business?</div>
                  <div className="grid grid-cols-2 gap-2">
                    {BUSINESS_TYPES.map((b) => (
                      <button key={b.id} onClick={() => changeBusinessType(b.id)} className={chip(businessType === b.id)}>{b.label}</button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    This decides what you are asked next: a clinic is matched on unmet demand, a café and a shop on footfall, an office on its business district.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="fma-budget" className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {modeCfg.budgetLabel} <span className="font-normal text-gray-500">({modeCfg.budgetUnit})</span>
                </label>
                {/* On a phone the on-screen keyboard covers the footer, so the
                    keyboard's own action key moves on rather than making the
                    visitor dismiss it first to reach "Continue". */}
                <input
                  id="fma-budget"
                  inputMode="numeric"
                  enterKeyHint="next"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    e.currentTarget.blur();
                    if (canContinue) setStep(3);
                  }}
                  placeholder={modeCfg.placeholder}
                  className="w-full px-3 py-2.5 min-h-[48px] text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-azure"
                />
                {budgetNumber > 0 && (
                  <div className="text-[11px] text-gray-500 mt-1">AED {budgetNumber.toLocaleString('en-US')}</div>
                )}
                {mode === 'business' && (
                  <p className="text-[11px] text-orange mt-1.5">
                    Commercial rent is not published per community, so this is used as a preference, not a filter, against registered residential rent per m².
                  </p>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-1.5">{modeCfg.spaceLabel}</div>
                <div className="grid grid-cols-2 gap-2">
                  {sizes.map((s) => (
                    <button key={s.id} onClick={() => setSizeId(s.id)} className={chip(sizeId === s.id)}>
                      {s.label}
                      <span className="block text-[11px] opacity-70">about {s.m2} m²</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">{modeCfg.spaceNote}</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-[11px] text-gray-600 mb-1.5">{modeCfg.priorityNote}</p>
              <p className="text-xs text-gray-600 mb-2.5">
                Pick up to {MAX_PRIORITIES} in order of importance — your first choice counts three times as much as your third.
                Areas without the data for a priority are listed separately rather than guessed.
              </p>
              <div className="space-y-4">
                {groups.map((g) => (
                  <div key={g.id}>
                    {g.label && (
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{g.label}</div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-2">
                      {g.items.map((p) => {
                        const order = priorityIds.indexOf(p.id);
                        const on = order >= 0;
                        const clash = on ? null : blockedBy(p);
                        const full = !on && !clash && priorityIds.length >= MAX_PRIORITIES;
                        const disabled = Boolean(clash) || full;
                        const mh = mustHaveFor(p.id, mode, type);
                        const pulls = on && (p.tension || []).filter((t) => priorityIds.includes(t))
                          .map((t) => (priorities.find((x) => x.id === t) || {}).label)
                          .filter(Boolean);
                        return (
                          <div key={p.id}>
                            <button
                              onClick={() => togglePriority(p.id)}
                              disabled={disabled}
                              title={clash ? `Pulls against “${clash.label}”` : undefined}
                              className={`${chip(on)} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} w-full flex items-start gap-2`}
                            >
                              <span className={`mt-0.5 w-5 h-5 rounded-full border shrink-0 flex items-center justify-center text-[10px] font-bold ${on ? 'bg-white border-white text-azure' : 'border-gray-400 text-transparent'}`}>
                                {on ? ORDINAL[order] || order + 1 : <Check className="w-3 h-3" />}
                              </span>
                              <span className="min-w-0">
                                <span className="block font-medium">{p.label}</span>
                                <span className={`block text-[11px] ${on ? 'text-white/80' : 'text-gray-500'}`}>
                                  {clash ? `Pulls against “${clash.label}”` : p.hint}
                                </span>
                              </span>
                            </button>
                            {on && pulls && pulls.length > 0 && (
                              <p className="mt-1 ml-1 text-[10px] text-orange">Trades off against {pulls.join(' and ')}.</p>
                            )}
                            {on && mh && (
                              <div className="mt-1.5 ml-1 pl-2 border-l-2 border-azure/30">
                                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Must have (optional)</div>
                                <div className="flex flex-wrap gap-1">
                                  {mh.options.map((o) => (
                                    <button
                                      key={o.value}
                                      onClick={() => setMustHave(p.id, o.value)}
                                      className={`text-[11px] rounded-full border px-3 min-h-[36px] inline-flex items-center touch-manipulation transition-colors ${
                                        mustHaves[p.id] === o.value ? 'bg-blue text-white border-blue' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                      }`}
                                    >
                                      {o.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {Object.values(mustHaves).some((v) => v != null) && (
                <p className="text-[11px] text-orange mt-2.5">
                  A must-have removes every area that does not meet it, including areas with no data for that measure.
                </p>
              )}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-gray-200 flex items-center justify-between gap-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
            className="inline-flex items-center gap-1.5 px-3 min-h-[48px] text-sm text-gray-600 hover:text-blue touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={() => (step === 3 ? run() : setStep(step + 1))}
            disabled={!canContinue}
            className="inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-azure text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-azure-dark touch-manipulation transition-colors"
          >
            {step === 3 ? `Show matching areas` : 'Continue'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
      </div>
    </>
  );
};

export default FindMyAreaWizard;
