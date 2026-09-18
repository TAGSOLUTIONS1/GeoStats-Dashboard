import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, Table2, Loader2 } from 'lucide-react';
import {
  downloadMapLayerCsv,
  downloadAllLayersCsv,
  downloadReportPdf,
} from '../../services/exportData';
import { getMapDataPointMeta } from '../../services/communityData';

/**
 * Export control for the map. Offers the layer currently painted, every
 * community layer at once, and the full PDF report.
 */
const MapExportMenu = ({ dataPointId }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  // Only map-backed points can be exported as a per-community layer.
  const meta = dataPointId ? getMapDataPointMeta(dataPointId) : null;

  const handleLayer = () => {
    setOpen(false);
    if (!downloadMapLayerCsv(dataPointId)) {
      window.alert('This data point is not painted per community, so it has no layer to export.');
    }
  };

  const handleAll = () => {
    setOpen(false);
    downloadAllLayersCsv();
  };

  const handlePdf = async () => {
    setOpen(false);
    setBusy({ done: 0, total: 0 });
    try {
      await downloadReportPdf({
        scope: 'full',
        onProgress: (done, total) => setBusy({ done, total }),
      });
    } catch (err) {
      console.error('PDF export failed', err);
      window.alert('The PDF could not be generated. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={!!busy}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Export the map data"
        className="flex bg-white px-2 lg:px-6 sm:px-4 py-2 rounded-3xl hover:bg-gray-50 disabled:opacity-60 disabled:cursor-wait items-center space-x-2 transition-colors"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
        ) : (
          <Download className="w-4 h-4 text-gray-600" />
        )}
        <span className="text-sm text-gray-700">
          {busy ? (busy.total ? `PDF ${busy.done}/${busy.total}` : 'Preparing') : 'Export'}
        </span>
        {!busy && <ChevronDown className="w-3 h-3 text-gray-500" />}
      </button>

      {open && !busy && (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          <button
            role="menuitem"
            onClick={handleLayer}
            disabled={!meta}
            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 disabled:opacity-45 disabled:hover:bg-white disabled:cursor-not-allowed flex items-start gap-2.5 border-b border-gray-100"
          >
            <Table2 className="w-3.5 h-3.5 text-azure mt-0.5 shrink-0" />
            <span>
              <span className="block text-xs font-semibold text-blue">
                CSV — {meta ? meta.label : 'current layer'}
              </span>
              <span className="block text-[10px] text-gray-500 leading-snug">
                {meta
                  ? `${meta.communities} communities, ranked, with source and limitation.`
                  : 'This data point is Dubai-wide, so it has no per-community layer.'}
              </span>
            </span>
          </button>

          <button
            role="menuitem"
            onClick={handleAll}
            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-start gap-2.5 border-b border-gray-100"
          >
            <Table2 className="w-3.5 h-3.5 text-azure mt-0.5 shrink-0" />
            <span>
              <span className="block text-xs font-semibold text-blue">CSV — all data points</span>
              <span className="block text-[10px] text-gray-500 leading-snug">
                Every community map layer as a column, one row per community, plus a source table.
              </span>
            </span>
          </button>

          <button
            role="menuitem"
            onClick={handlePdf}
            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-start gap-2.5"
          >
            <FileText className="w-3.5 h-3.5 text-orange mt-0.5 shrink-0" />
            <span>
              <span className="block text-xs font-semibold text-blue">PDF — full data report</span>
              <span className="block text-[10px] text-gray-500 leading-snug">
                Every live data point with its provenance and ranked table. Large file, takes a few seconds.
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MapExportMenu;
