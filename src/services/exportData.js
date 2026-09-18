// Export surfaces for the dashboard: CSV for the map, CSV + PDF for the table.
//
// Every export carries its own provenance — source, period, coverage and the
// stated limitation — because a number that leaves the product without its
// caveat is the easiest way for this data to be misread.
import { mapDataPoints, getValuesByCommunity, getMapDataPointMeta } from './communityData';
import { getCardDataset } from './cardData';
import { dataSections } from '../data/sidebarData';
import {
  communities,
  getColumnValues,
  getColumnLabel,
  getColumnSource,
  formatCell,
  tableBackedIds,
} from './tableData';

const STAMP = () => new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ utils */

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const csvEscape = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
const csvRow = (cells) => cells.map(csvEscape).join(',');

/** Every data point that can appear in an export, deduped and in section order. */
export const exportablePoints = () => {
  const seen = new Set();
  const out = [];
  dataSections.forEach((section) => {
    (section.items || []).filter(Boolean).forEach((dp) => {
      if (seen.has(dp.id) || dp.isPremium) return;
      seen.add(dp.id);
      const meta = getMapDataPointMeta(dp.id);
      const card = meta ? null : getCardDataset(dp.id);
      if (!meta && !card) return;
      out.push({
        id: dp.id,
        label: dp.label,
        section: section.label,
        kind: meta ? 'map' : 'card',
        meta,
        card,
      });
    });
  });
  return out;
};

/* -------------------------------------------------------------- map CSV */

/**
 * One data point, every community that has a value, ranked highest first.
 * Used by the Export control on the map.
 */
export const downloadMapLayerCsv = (dataPointId) => {
  const meta = getMapDataPointMeta(dataPointId);
  if (!meta) return false;

  const values = getValuesByCommunity(dataPointId) || {};
  const rows = communities
    .filter((c) => values[c.code] != null)
    .map((c) => ({ ...c, value: values[c.code] }))
    .sort((a, b) => b.value - a.value);

  const lines = [
    csvRow(['GeoStats Dubai — ' + meta.label]),
    csvRow(['Exported', STAMP()]),
    csvRow(['Source', meta.source || '']),
    csvRow(['Period', meta.period || 'not stated']),
    csvRow(['Coverage', `${meta.communities} of ${communities.length} communities`]),
    meta.inverted ? csvRow(['Scale', 'Inverted — a higher value is worse']) : null,
    meta.note ? csvRow(['Limitation', meta.note]) : null,
    '',
    csvRow(['Rank', 'Community code', 'Community', 'Value', 'Formatted']),
    ...rows.map((r, i) =>
      csvRow([i + 1, r.code, r.name, r.value, formatCell(r.value, dataPointId)])
    ),
  ].filter((l) => l !== null);

  saveBlob(
    new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }),
    `geostats-${dataPointId}-${STAMP()}.csv`
  );
  return true;
};

/**
 * Every map-backed data point as columns, every community as a row.
 * The "all data points" option on the map export menu.
 */
export const downloadAllLayersCsv = () => {
  const ids = Object.keys(mapDataPoints).filter((id) => tableBackedIds.has(id));
  const valueSets = ids.map((id) => getColumnValues(id));

  const header = csvRow(['Community code', 'Community', ...ids.map(getColumnLabel)]);
  const body = communities
    .map((c) =>
      csvRow([
        c.code,
        c.name,
        ...ids.map((id, i) => {
          const v = valueSets[i][c.code];
          return v == null ? '' : v;
        }),
      ])
    );

  const provenance = [
    '',
    csvRow(['Column', 'Source and period', 'Communities with data']),
    ...ids.map((id) => {
      const meta = getMapDataPointMeta(id);
      return csvRow([getColumnLabel(id), getColumnSource(id), meta ? meta.communities : '']);
    }),
  ];

  const lines = [
    csvRow(['GeoStats Dubai — all community data points']),
    csvRow(['Exported', STAMP()]),
    csvRow(['Data points', ids.length]),
    csvRow(['Communities', communities.length]),
    csvRow(['Note', 'Blank means the source has no credible value for that community; nothing is estimated.']),
    '',
    header,
    ...body,
    ...provenance,
  ];

  saveBlob(
    new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }),
    `geostats-all-data-points-${STAMP()}.csv`
  );
  return ids.length;
};

/* -------------------------------------------------------------- PDF report */

const INK = [5, 44, 67];
const AZURE = [54, 150, 168];
const MUTED = [110, 132, 148];

/**
 * Full report: every live data point, with its provenance and — for the
 * community-level ones — its ranked table.
 *
 * `scope` 'full' covers every data point; 'current' covers only the columns
 * currently chosen in the table view.
 *
 * jsPDF is imported dynamically so it never lands in the initial bundle.
 */
export const downloadReportPdf = async ({ scope = 'full', columnIds = [], onProgress } = {}) => {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 42;

  const points =
    scope === 'current'
      ? columnIds
          .map((id) => exportablePoints().find((p) => p.id === id))
          .filter(Boolean)
      : exportablePoints();

  /* ---- cover ---- */
  const mapCount = points.filter((p) => p.kind === 'map').length;
  const cardCount = points.filter((p) => p.kind === 'card').length;

  doc.setFillColor(...INK);
  doc.rect(0, 0, W, 150, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('GeoStats Dubai', M, 70);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text(
    scope === 'current' ? 'Table View report' : 'Community data report — full catalogue',
    M,
    96
  );
  doc.setFontSize(10);
  doc.setTextColor(180, 210, 220);
  doc.text(`Generated ${STAMP()}`, M, 120);

  doc.setTextColor(...INK);
  doc.setFontSize(11);
  let y = 190;
  const bullet = (label, value) => {
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), M, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(label, M + 58, y);
    doc.setTextColor(...INK);
    y += 20;
  };
  bullet('data points in this report', points.length);
  bullet('community map layers', mapCount);
  bullet('Dubai / UAE-wide indicators', cardCount);
  bullet('communities covered by the boundary set', communities.length);

  y += 14;
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  const preface = doc.splitTextToSize(
    'Each section below states the source, the period covered, how many communities carry a value, ' +
      'the method used and the known limitation of that metric. A blank cell means the source has no ' +
      'credible value for that community — nothing in this report is estimated, interpolated or filled ' +
      'with an average. Coverage varies widely between data points, so read the coverage line before ' +
      'comparing two metrics.',
    W - M * 2
  );
  doc.text(preface, M, y);
  y += preface.length * 13 + 16;

  /* ---- contents ---- */
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Contents', M, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['#', 'Data point', 'Section', 'Type', 'Coverage']],
    body: points.map((p, i) => [
      i + 1,
      p.label,
      p.section,
      p.kind === 'map' ? 'Map layer' : 'Indicator',
      p.kind === 'map' ? `${p.meta.communities} / ${communities.length}` : p.card.scopeLabel || '—',
    ]),
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 3, textColor: INK },
    headStyles: { fillColor: AZURE, textColor: 255, fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 248, 249] },
    margin: { left: M, right: M },
  });

  /* ---- one section per data point ---- */
  points.forEach((p, i) => {
    if (onProgress) onProgress(i + 1, points.length, p.label);
    doc.addPage();

    doc.setFillColor(...INK);
    doc.rect(0, 0, W, 4, 'F');

    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    const title = doc.splitTextToSize(`${i + 1}. ${p.label}`, W - M * 2);
    doc.text(title, M, 48);
    let ty = 48 + title.length * 17;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(p.section, M, ty);
    ty += 18;

    const facts = [];
    if (p.kind === 'map') {
      const m = p.meta;
      facts.push(['Source', m.source || '—']);
      facts.push(['Period', m.period || 'not stated']);
      facts.push(['Coverage', `${m.communities} of ${communities.length} communities`]);
      if (m.inverted) facts.push(['Scale', 'Inverted — a higher value is worse']);
      if (m.note) facts.push(['Limitation', m.note]);
    } else {
      const c = p.card;
      facts.push(['Source', c.source || '—']);
      facts.push(['Scope', c.scopeLabel || '—']);
      if (c.yearRange) facts.push(['Period', c.yearRange.join(' – ')]);
      else if (c.period) facts.push(['Period', c.period]);
      if (c.isProxy) facts.push(['Caution', 'Proxy indicator — not the literal metric']);
      if (c.note) facts.push(['Note', c.note]);
    }

    autoTable(doc, {
      startY: ty,
      body: facts,
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 3, textColor: INK, valign: 'top' },
      columnStyles: {
        0: { cellWidth: 74, fontStyle: 'bold', textColor: MUTED },
        1: { cellWidth: W - M * 2 - 74 },
      },
      margin: { left: M, right: M },
    });

    const afterFacts = doc.lastAutoTable.finalY + 14;

    if (p.kind === 'map') {
      const values = getValuesByCommunity(p.id) || {};
      const ranked = communities
        .filter((c) => values[c.code] != null)
        .map((c) => ({ ...c, v: values[c.code] }))
        .sort((a, b) => b.v - a.v);

      autoTable(doc, {
        startY: afterFacts,
        head: [['Rank', 'Community', p.label]],
        body: ranked.map((r, n) => [n + 1, r.name, formatCell(r.v, p.id)]),
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2.6, textColor: INK },
        headStyles: { fillColor: AZURE, textColor: 255, fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 248, 249] },
        columnStyles: { 0: { cellWidth: 38 }, 2: { halign: 'right' } },
        margin: { left: M, right: M, top: 40 },
      });
    } else if (p.card.series && p.card.series.length) {
      autoTable(doc, {
        startY: afterFacts,
        head: [['Period', 'Value']],
        body: p.card.series.map((s) => [
          String(s.year),
          `${Number(s.value).toLocaleString('en-US', { maximumFractionDigits: 2 })}${
            p.card.unit === 'percent' ? '%' : ''
          }`,
        ]),
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2.6, textColor: INK },
        headStyles: { fillColor: AZURE, textColor: 255, fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 248, 249] },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: M, right: M, top: 40 },
      });
    } else if (p.card.value !== undefined) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...AZURE);
      doc.text(
        Number(p.card.value).toLocaleString('en-US', { maximumFractionDigits: 2 }),
        M,
        afterFacts + 26
      );
    }
  });

  /* ---- page numbers + footer ---- */
  const pages = doc.internal.getNumberOfPages();
  for (let n = 1; n <= pages; n++) {
    doc.setPage(n);
    if (n === 1) continue;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text('GeoStats Dubai · generated ' + STAMP(), M, doc.internal.pageSize.getHeight() - 20);
    doc.text(
      `${n} / ${pages}`,
      W - M,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'right' }
    );
  }

  doc.save(
    scope === 'current'
      ? `geostats-table-report-${STAMP()}.pdf`
      : `geostats-full-data-report-${STAMP()}.pdf`
  );
  return points.length;
};

export default downloadReportPdf;
