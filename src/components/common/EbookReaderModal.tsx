import React, { useState } from 'react';
import { Book } from '../../types';
import {
  X,
  ExternalLink,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  BookOpen,
  Info,
} from 'lucide-react';

interface EbookReaderModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EbookReaderModal: React.FC<EbookReaderModalProps> = ({
  book,
  isOpen,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !book) return null;

  const pdfUrl = book.pdfUrl?.trim() || '';

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = book.ebookFileName || `${book.title.replace(/\s+/g, '_')}_Softcopy.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenExternal = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="ebook-reader-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="ebook-reader-container"
        className={`bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 w-full ${
          isFullscreen
            ? 'fixed inset-2 z-50 h-[calc(100vh-1rem)]'
            : 'max-w-5xl h-[88vh]'
        }`}
      >
        {/* Header Bar */}
        <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between gap-3 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100 truncate">
                  {book.title}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 shrink-0 hidden sm:inline-block">
                  Digital E-Book Softcopy
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {book.author} • {book.category} ({book.edition})
                {book.ebookFileSize ? ` • ${book.ebookFileSize}` : ''}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {pdfUrl && (
              <>
                <button
                  type="button"
                  id="ebook-btn-external"
                  onClick={handleOpenExternal}
                  title="Open in new window / tab"
                  className="p-2 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Open New Tab</span>
                </button>

                <button
                  type="button"
                  id="ebook-btn-download"
                  onClick={handleDownload}
                  title="Download digital softcopy"
                  className="p-2 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Download</span>
                </button>
              </>
            )}

            <button
              type="button"
              id="ebook-btn-fullscreen"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
              className="p-2 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              id="ebook-btn-close"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-700/80 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reader View Area */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
          {pdfUrl ? (
            <>
              {/* Fallback tip header */}
              <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <Info className="w-3 h-3 text-blue-400 shrink-0" />
                  <span>
                    Viewing digital softcopy for student study. If your browser blocks iframe viewing, use the "Open New Tab" button.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="text-blue-400 hover:text-blue-300 font-semibold underline shrink-0 cursor-pointer text-[10px]"
                >
                  Direct Reader Link
                </button>
              </div>

              {/* PDF / EBook IFrame */}
              <iframe
                id="ebook-reader-frame"
                src={pdfUrl}
                title={`Softcopy Reader - ${book.title}`}
                className="w-full flex-1 border-0 bg-slate-900"
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-3 text-slate-500">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-200">
                No Digital Softcopy Attached
              </h4>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                The library administrator has not yet uploaded or linked a digital PDF or e-book for "{book.title}". You can borrow the physical book from Shelf{' '}
                <span className="font-mono font-bold text-amber-400">{book.shelfNumber}</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
