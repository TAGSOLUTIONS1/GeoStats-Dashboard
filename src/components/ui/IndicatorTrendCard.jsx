import React from 'react';
import { getCardDataset } from '../../services/cardData';

const fmt = (v, unit) => {
  if (v == null) return 'n/a';
  if (unit === 'percent') return `${v.toFixed(2)}%`;
  if (unit === 'usd') return `$${Math.round(v).toLocaleString('en-US')}`;
  if (unit === 'aed') return `AED ${Math.round(v).toLocaleString('en-US')}`;
  if (unit === 'count') return Math.round(v).toLocaleString('en-US');
  if (unit === 'years') return `${v} yrs`;
  if (unit === 'percent') return `${v}%`;
  return Math.round(v).toLocaleString('en-US');
};

const Shell = ({ label, scopeLabel, sub, isProxy, source, data, children }) => (
  <div className="pointer-events-auto bg-white/95 backdrop-blur rounded-lg shadow-lg border border-gray-200 p-3 w-[300px] max-w-full">
    <div className="text-xs font-inter font-semibold text-blue">{label}</div>
    <div className="text-[10px] text-gray-500">{scopeLabel}{sub ? ` · ${sub}` : ''}</div>
    {data && data.inverted && (
      <div className="text-[10px] text-orange mt-0.5">Higher value = worse</div>
    )}
    {isProxy && (
      <div className="text-[10px] text-orange mt-0.5">
        Proxy indicator &mdash; not the literal metric
      </div>
    )}
    {children}
    <div className="text-[10px] text-gray-400 mt-1 border-t border-gray-100 pt-1">
      Source: {source}
    </div>
  </div>
);

const TrendBody = ({ data }) => {
  const { series, unit } = data;
  const values = series.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const W = 260;
  const H = 90;
  const x = (i) => (i / (series.length - 1)) * W;
  const y = (v) => H - ((v - min) / span) * H;
  const line = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ');
  const latest = series[series.length - 1];
  const first = series[0];
  const change = first.value ? ((latest.value - first.value) / Math.abs(first.value)) * 100 : 0;

  return (
    <>
      <div className="flex items-baseline space-x-2 mb-1 mt-1">
        <span className="text-lg font-semibold text-blue">{fmt(latest.value, unit)}</span>
        <span className="text-[10px] text-gray-500">in {latest.year}</span>
        <span className={`text-[10px] ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}% since {first.year}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[90px]" preserveAspectRatio="none">
        <path d={`${line} L${W},${H} L0,${H} Z`} fill="rgba(59,130,246,0.12)" />
        <path d={line} fill="none" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <circle cx={x(series.length - 1)} cy={y(latest.value)} r="3" fill="#3b82f6" />
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{first.year}</span>
        <span>{latest.year}</span>
      </div>
    </>
  );
};

const DistributionBody = ({ data }) => {
  const { bands, value, unit, totalPopulation, malePct } = data;
  const peak = Math.max(...bands.map((b) => b.population)) || 1;

  return (
    <>
      <div className="flex items-baseline space-x-2 mb-1 mt-1">
        <span className="text-lg font-semibold text-blue">{fmt(value, unit)}</span>
        <span className="text-[10px] text-gray-500">median</span>
        <span className="text-[10px] text-gray-500">{malePct}% male</span>
      </div>
      <div className="flex items-end space-x-[2px] h-[70px]">
        {bands.map((b) => (
          <div
            key={b.label}
            title={`${b.label}: ${b.population.toLocaleString('en-US')}`}
            className="flex-1 bg-blue-400 rounded-t"
            style={{ height: `${(b.population / peak) * 100}%`, minHeight: '2px' }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{bands[0].label}</span>
        <span>{bands[bands.length - 1].label}</span>
      </div>
      <div className="text-[10px] text-gray-500 mt-1">
        Total population {totalPopulation.toLocaleString('en-US')}
      </div>
    </>
  );
};

const ValueBody = ({ data }) => (
  <>
    <div className="flex items-baseline space-x-2 mb-1 mt-1">
      <span className="text-lg font-semibold text-blue">{fmt(data.value, data.unit)}</span>
      {data.areas ? (
        <span className="text-[10px] text-gray-500">across {data.areas} areas</span>
      ) : null}
    </div>
    {data.note && <div className="text-[10px] text-gray-500">{data.note}</div>}
  </>
);

const IndicatorTrendCard = ({ dataPointId }) => {
  const data = getCardDataset(dataPointId);
  if (!data) return null;

  let sub = '';
  if (data.kind === 'series') sub = `${data.yearRange[0]}–${data.yearRange[1]}`;
  else if (data.kind === 'distribution') sub = `${data.year}`;
  else sub = data.period || '';

  return (
    <Shell
      label={data.label}
      scopeLabel={data.scopeLabel}
      sub={sub}
      isProxy={data.isProxy}
      source={data.source}
      data={data}
    >
      {data.kind === 'series' && <TrendBody data={data} />}
      {data.kind === 'distribution' && <DistributionBody data={data} />}
      {data.kind === 'value' && <ValueBody data={data} />}
    </Shell>
  );
};

export default IndicatorTrendCard;
