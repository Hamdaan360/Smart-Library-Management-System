import React, { useState, useEffect, useRef } from 'react';
import { Book } from '../../types';
import {
  X,
  BookOpen,
  FileText,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  Bookmark,
  BookmarkCheck,
  Sun,
  Moon,
  Coffee,
  Clock,
  Quote,
  StickyNote,
  Check,
  Copy,
  Layers,
  Sparkles,
  Search,
  Eye,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';

interface Props {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

type ReaderTheme = 'light' | 'sepia' | 'dark';
type ViewMode = 'pdf' | 'image' | 'notes';

// Generated rich academic pages for image-based reader mode
interface AcademicPage {
  pageNumber: number;
  chapterTitle: string;
  subtitle?: string;
  contentHeading: string;
  paragraphs: string[];
  keyTerms?: { term: string; definition: string }[];
  highlightBox?: { title: string; body: string; type: 'concept' | 'formula' | 'case' };
  figureCaption?: string;
  figureType?: 'flowchart' | 'graph' | 'architecture' | 'formula';
}

export const StudentEbookReaderModal: React.FC<Props> = ({ book, isOpen, onClose }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('pdf');
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(8);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>([]);
  const [studyNotes, setStudyNotes] = useState<string>('');
  const [notesSavedNotice, setNotesSavedNotice] = useState<boolean>(false);
  const [readingTimeSeconds, setReadingTimeSeconds] = useState<number>(0);
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);
  const [showCitationModal, setShowCitationModal] = useState<boolean>(false);
  const [pageJumpInput, setPageJumpInput] = useState<string>('1');

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize book specific storage, bookmarks and notes
  useEffect(() => {
    if (!book || !isOpen) return;

    // Default to image mode if no pdfUrl or if pdfUrl is empty
    if (!book.pdfUrl) {
      setViewMode('image');
    } else {
      setViewMode('pdf');
    }

    // Load saved bookmarks from localStorage
    try {
      const savedBm = localStorage.getItem(`vvuc_bookmarks_${book.id}`);
      if (savedBm) {
        const parsed = JSON.parse(savedBm);
        setBookmarkedPages(parsed);
      } else {
        setBookmarkedPages([]);
      }

      // Load saved notes
      const savedNotes = localStorage.getItem(`vvuc_notes_${book.id}`);
      if (savedNotes) {
        setStudyNotes(savedNotes);
      } else {
        setStudyNotes('');
      }

      // Load last read page
      const lastPage = localStorage.getItem(`vvuc_lastpage_${book.id}`);
      if (lastPage) {
        const p = parseInt(lastPage, 10);
        if (!isNaN(p) && p >= 1 && p <= 8) {
          setCurrentPage(p);
          setPageJumpInput(String(p));
        }
      } else {
        setCurrentPage(1);
        setPageJumpInput('1');
      }
    } catch {
      // Ignore storage errors
    }

    // Reset reading timer
    setReadingTimeSeconds(0);
  }, [book, isOpen]);

  // Reading timer effect
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setReadingTimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (!isOpen || !book) return null;

  // Format elapsed time (MM:SS or HH:MM:SS)
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {
        // Fallback handled gracefully
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(75, z - 25));
  const handleZoomReset = () => setZoomLevel(100);

  // Bookmark toggle
  const toggleBookmark = (page: number) => {
    let updated: number[];
    if (bookmarkedPages.includes(page)) {
      updated = bookmarkedPages.filter((p) => p !== page);
    } else {
      updated = [...bookmarkedPages, page].sort((a, b) => a - b);
    }
    setBookmarkedPages(updated);
    try {
      localStorage.setItem(`vvuc_bookmarks_${book.id}`, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Save notes
  const handleSaveNotes = () => {
    try {
      localStorage.setItem(`vvuc_notes_${book.id}`, studyNotes);
      setNotesSavedNotice(true);
      setTimeout(() => setNotesSavedNotice(false), 2500);
    } catch {
      // Ignore
    }
  };

  // Jump page
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setPageJumpInput(String(newPage));
      try {
        localStorage.setItem(`vvuc_lastpage_${book.id}`, String(newPage));
      } catch {
        // Ignore
      }
    }
  };

  // Academic citations
  const citations = {
    apa: `${book.author}. (${book.publicationYear}). ${book.title} (${book.edition || '1st ed.'}). ${book.publisher || 'University Press'}.`,
    mla: `${book.author}. ${book.title}. ${book.edition ? book.edition + ', ' : ''}${book.publisher || 'University Press'}, ${book.publicationYear}.`,
    chicago: `${book.author}. ${book.title}. ${book.edition ? book.edition + '. ' : ''}${book.publisher || 'University Press'}, ${book.publicationYear}.`,
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCitation(type);
    setTimeout(() => setCopiedCitation(null), 2500);
  };

  // Academic chapters / simulated textbook curriculum pages for the visual reader
  const academicPages: AcademicPage[] = [
    {
      pageNumber: 1,
      chapterTitle: 'Front Matter & Title Page',
      subtitle: `Academic Curriculum Edition • VVUC Department of ${book.department || 'Higher Education'}`,
      contentHeading: book.title,
      paragraphs: [
        `Author: ${book.author} | Publisher: ${book.publisher} | Publication Year: ${book.publicationYear}`,
        `International Standard Book Number (ISBN): ${book.isbn} | Library Shelf Call: ${book.shelfNumber}`,
        `Authorized for Academic Curriculum and Research Study by Vidya Vikas Universal College (VVUC) Central Library Holdings.`,
        book.description || 'Comprehensive textbook covering core theoretical frameworks and real-world practical implementations.',
      ],
      keyTerms: [
        { term: 'Course Module', definition: `${book.department} Semester Core Subject Reference` },
        { term: 'Subject Classification', definition: book.subject || 'Core Academic Curriculum' },
        { term: 'Access Clearance', definition: 'Open Student Reading License (On-Campus & Remote)' },
      ],
      highlightBox: {
        title: 'Library Holding Advisory',
        body: 'This digital softcopy is provisioned for active VVUC students for private academic research, semester revision, and coursework.',
        type: 'concept',
      },
    },
    {
      pageNumber: 2,
      chapterTitle: 'Chapter 1: Theoretical Foundations & Principles',
      subtitle: 'Part I: Foundational Concepts & Historical Background',
      contentHeading: '1.1 Fundamental Axioms & Contextual Scope',
      paragraphs: [
        `In the analysis of ${book.subject || 'the discipline'}, rigorous conceptual modeling precedes empirical verification. The primary tenets establish the operational parameters under which modern frameworks operate.`,
        `Early foundational paradigms provided structural cohesion, yet modern methodologies demand scalable abstractions. By establishing unambiguous axioms early in the curriculum, students develop systemic problem-solving instincts.`,
        `When evaluating the boundary conditions, one must take into account both computational constraints and theoretical limits, ensuring that systems maintain algorithmic consistency under fluctuating workloads.`,
      ],
      keyTerms: [
        { term: 'Axiomatic Scope', definition: 'The initial set of established truths serving as premises for deduction.' },
        { term: 'Empirical Verification', definition: 'Corroboration of hypotheses through observed, repeatable measurements.' },
      ],
      highlightBox: {
        title: 'Key Academic Law',
        body: 'System throughput is bounded by the slowest sequential bottleneck, requiring balanced resource allocation across all sub-components.',
        type: 'formula',
      },
      figureCaption: 'Figure 1.1: Schematic representation of systemic workflow across state transitions.',
      figureType: 'flowchart',
    },
    {
      pageNumber: 3,
      chapterTitle: 'Chapter 2: Structural Methodologies & Architecture',
      subtitle: 'Part I: Design Patterns & Analytical Approaches',
      contentHeading: '2.1 Architectural Deconstruction & Modular Design',
      paragraphs: [
        `Modularization minimizes cognitive overhead and facilitates independent unit verification. Each subsystem communicates across well-defined interfaces with deterministic contracts.`,
        `High cohesion within modules combined with loose coupling between modules ensures that internal optimizations do not introduce cascading regressions across the wider architecture.`,
        `Modern academic literature emphasizes fault isolation patterns, where partial subsystem disruptions do not degrade overarching service continuity.`,
      ],
      highlightBox: {
        title: 'Architectural Maxim',
        body: 'Decouple state management from presentation pipelines to maximize testability and horizontal scalability.',
        type: 'concept',
      },
      figureCaption: 'Figure 2.3: Layered architectural topology with unidirectional data flows.',
      figureType: 'architecture',
    },
    {
      pageNumber: 4,
      chapterTitle: 'Chapter 3: Mathematical Modeling & Quantitative Analysis',
      subtitle: 'Part II: Algorithmic Rigor & Formal Proofs',
      contentHeading: '3.2 Algorithmic Complexity & Asymptotic Bounds',
      paragraphs: [
        `Formal time and space complexity evaluations reveal long-term behavior as problem dimension N scales towards infinity.`,
        `Consider the recursive relation T(n) = aT(n/b) + f(n). By applying the Master Theorem, students can swiftly classify algorithms into optimal polynomial, logarithmic, or exponential categories.`,
        `Optimization techniques such as memoization and divide-and-conquer effectively reduce worst-case operational latencies across large datasets.`,
      ],
      highlightBox: {
        title: 'Core Formulation',
        body: 'T(n) = O(N log N) represents the lower computational bound for comparison-based sorting routines.',
        type: 'formula',
      },
      figureCaption: 'Figure 3.2: Asymptotic growth curves comparing O(1), O(log N), O(N), and O(N²).',
      figureType: 'graph',
    },
    {
      pageNumber: 5,
      chapterTitle: 'Chapter 4: Real-World Case Studies & Industry Applications',
      subtitle: 'Part II: Practical Implementations in Enterprise Environments',
      contentHeading: '4.1 Practical Deployment Case: Large-Scale Distributed Operations',
      paragraphs: [
        `To bridge academic theory with modern industry practice, we examine how leading engineering organizations apply these concepts in production environments.`,
        `A key case study involves migrating legacy monolithic architectures into resilient microservices. By enforcing strict API boundaries and idempotent transactions, data inconsistencies were eradicated.`,
        `Telemetry, automated alerts, and continuous integration pipelines safeguard operational integrity under volatile concurrent user activity.`,
      ],
      highlightBox: {
        title: 'Case Study Takeaway',
        body: 'Proactive observability and distributed tracing reduce mean time to recovery (MTTR) by upwards of 70% in high-availability environments.',
        type: 'case',
      },
    },
    {
      pageNumber: 6,
      chapterTitle: 'Chapter 5: Synthesis, Critical Discussion & Future Trends',
      subtitle: 'Part III: Emerging Frontiers & Next-Generation Paradigms',
      contentHeading: '5.1 Automated Optimization & Intelligent Augmentation',
      paragraphs: [
        `Recent developments in computational intelligence have reshaped how optimization problems are approached. Heuristic approximations now solve previously intractable NP-hard formulations in near real-time.`,
        `Furthermore, security-by-design has transitioned from an afterthought to a foundational prerequisite, demanding cryptographic validation at every protocol interchange.`,
        `Students are encouraged to analyze the trade-offs between absolute theoretical precision and real-world computational efficiency.`,
      ],
      keyTerms: [
        { term: 'Heuristic Convergence', definition: 'Rapid approximation techniques yielding near-optimal solutions efficiently.' },
        { term: 'Zero-Trust Architecture', definition: 'Security model requiring continuous strict authentication for all transactions.' },
      ],
    },
    {
      pageNumber: 7,
      chapterTitle: 'Chapter Review: Questions, Exercises & Problems',
      subtitle: 'Part III: Examination Preparation & Problem Sets',
      contentHeading: 'Self-Assessment & Examination Practice Problems',
      paragraphs: [
        `1. Differentiate between deterministic and stochastic modeling paradigms with appropriate academic examples.`,
        `2. Derive the closed-form recurrence equation for divide-and-conquer partitioning under non-uniform sub-problem sizing.`,
        `3. Explain why loose architectural coupling enhances fault tolerance in concurrent systems.`,
        `4. Critique the trade-offs between pessimistic and optimistic concurrency control mechanisms in transaction databases.`,
      ],
      highlightBox: {
        title: 'Study Tip for VVUC Exams',
        body: 'Always outline your assumptions and diagram the system architecture before writing formal mathematical proofs.',
        type: 'concept',
      },
    },
    {
      pageNumber: 8,
      chapterTitle: 'Appendix & Bibliography',
      subtitle: 'Approved Academic References & Supplemental Readings',
      contentHeading: 'Standard Curriculum Citations & References',
      paragraphs: [
        `• Knuth, D. E. The Art of Computer Programming, Vol 1–3. Addison-Wesley.`,
        `• Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. Introduction to Algorithms. MIT Press.`,
        `• Tanenbaum, A. S. Modern Distributed Operating Systems and Architecture. Pearson.`,
        `• VVUC Department of ${book.department || 'Science'} Academic Syllabus & Examination Handbook (Current Session).`,
      ],
      keyTerms: [
        { term: 'Library Stacks Access', definition: `Physical copy available on Shelf ${book.shelfNumber}, Central Library Wing.` },
      ],
    },
  ];

  const currentPageData = academicPages[currentPage - 1] || academicPages[0];

  // Theme styling helpers
  const getThemeClasses = () => {
    switch (theme) {
      case 'sepia':
        return {
          bg: 'bg-[#F4ECD8]',
          text: 'text-[#433422]',
          paperBg: 'bg-[#FDF8EE]',
          border: 'border-[#E2D5BE]',
          subtext: 'text-[#6D5A43]',
          accent: 'text-[#8B5E34]',
          accentBg: 'bg-[#EBDCC0]',
        };
      case 'dark':
        return {
          bg: 'bg-[#18181B]',
          text: 'text-[#E4E4E7]',
          paperBg: 'bg-[#27272A]',
          border: 'border-[#3F3F46]',
          subtext: 'text-[#A1A1AA]',
          accent: 'text-[#38BDF8]',
          accentBg: 'bg-[#1E293B]',
        };
      case 'light':
      default:
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-900',
          paperBg: 'bg-white',
          border: 'border-slate-200',
          subtext: 'text-slate-600',
          accent: 'text-blue-900',
          accentBg: 'bg-blue-50',
        };
    }
  };

  const currentTheme = getThemeClasses();

  return (
    <div
      ref={containerRef}
      id="student-ebook-reader-modal"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-xs select-none"
    >
      {/* Top Header & Reader Control Bar */}
      <header className="bg-[#071129] border-b border-amber-500/30 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-white shrink-0 z-20 shadow-lg">
        {/* Book Title & Department Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white truncate">{book.title}</h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                VVUC E-Library
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {book.author} • {book.edition || 'Academic Edition'} ({book.publicationYear})
              {book.ebookFileSize ? ` • ${book.ebookFileSize}` : ''}
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 shrink-0">
          {book.pdfUrl && (
            <button
              type="button"
              id="reader-tab-pdf"
              onClick={() => setViewMode('pdf')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'pdf'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Native PDF document view"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">PDF Document</span>
            </button>
          )}

          <button
            type="button"
            id="reader-tab-image-reader"
            onClick={() => setViewMode('image')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'image'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title="Clean Image / Academic Page Reader Mode"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Visual Page Reader</span>
          </button>

          <button
            type="button"
            id="reader-tab-notes"
            onClick={() => setViewMode('notes')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'notes'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title="Personal Study Notes"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Study Notes</span>
          </button>
        </div>

        {/* Right Tools & Close */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Reading Time Badge */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-amber-300 font-mono"
            title="Time spent reading this session"
          >
            <Clock className="w-3 h-3 text-amber-400" />
            {formatTimer(readingTimeSeconds)}
          </div>

          {/* Citation Button */}
          <button
            type="button"
            onClick={() => setShowCitationModal(true)}
            className="p-2 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-white/10 transition-colors"
            title="Copy academic citation (APA/MLA/Chicago)"
          >
            <Quote className="w-4 h-4" />
          </button>

          {/* External / Download Button */}
          {book.pdfUrl && (
            <a
              href={book.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={book.ebookFileName || `${book.title}.pdf`}
              className="p-2 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-white/10 transition-colors"
              title="Download or open raw softcopy PDF"
            >
              <Download className="w-4 h-4" />
            </a>
          )}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-white/10 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Modal */}
          <button
            type="button"
            id="reader-btn-close"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Close Reader"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Sub-Toolbar (Available in Visual Page Reader Mode) */}
      {viewMode === 'image' && (
        <div className="bg-[#0b1b42] border-b border-white/10 px-4 py-2 flex items-center justify-between gap-3 text-xs text-white shrink-0 flex-wrap">
          {/* Page Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 font-mono text-xs">
              <span>Page</span>
              <input
                type="text"
                value={pageJumpInput}
                onChange={(e) => setPageJumpInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const p = parseInt(pageJumpInput, 10);
                    if (!isNaN(p)) handlePageChange(p);
                  }
                }}
                className="w-10 text-center py-0.5 rounded bg-white/15 border border-white/20 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <span>of {totalPages}</span>
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Bookmark Current Page */}
            <button
              type="button"
              onClick={() => toggleBookmark(currentPage)}
              className={`ml-2 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                bookmarkedPages.includes(currentPage)
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300'
              }`}
              title={bookmarkedPages.includes(currentPage) ? 'Remove Bookmark' : 'Bookmark Page'}
            >
              {bookmarkedPages.includes(currentPage) ? (
                <BookmarkCheck className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {bookmarkedPages.includes(currentPage) ? 'Bookmarked' : 'Bookmark'}
              </span>
            </button>
          </div>

          {/* Reader Display Customization: Zoom & Theme */}
          <div className="flex items-center gap-3">
            {/* Theme Selector for Eye Comfort */}
            <div className="flex items-center bg-white/10 p-0.5 rounded-lg border border-white/15">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Light Theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('sepia')}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'sepia'
                    ? 'bg-[#F4ECD8] text-[#433422] font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Sepia (Warm Reading Paper)"
              >
                <Coffee className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'dark' ? 'bg-slate-900 text-amber-300 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Dark Theme"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-white/10 px-1 py-0.5 rounded-lg border border-white/15">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 rounded hover:bg-white/20 text-slate-300 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span
                onClick={handleZoomReset}
                className="text-[11px] font-mono px-1 text-slate-300 cursor-pointer hover:text-white"
                title="Reset to 100%"
              >
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 rounded hover:bg-white/20 text-slate-300 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table of Contents Drawer Toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen((s) => !s)}
              className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs font-semibold ${
                sidebarOpen
                  ? 'bg-amber-400 text-slate-950 border-amber-400'
                  : 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-300'
              }`}
              title="Toggle Chapter Thumbnails & Outline"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Pages</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Body Content */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* VIEW MODE 1: NATIVE PDF VIEWER */}
        {viewMode === 'pdf' && (
          <div className="flex-1 bg-slate-900 flex flex-col relative w-full h-full">
            {book.pdfUrl ? (
              <div className="flex-1 relative w-full h-full">
                <iframe
                  ref={iframeRef}
                  src={
                    book.pdfUrl.startsWith('data:')
                      ? book.pdfUrl
                      : `${book.pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`
                  }
                  title={`${book.title} PDF Document`}
                  className="w-full h-full border-0"
                  allow="fullscreen"
                />

                {/* Bottom Fallback Overlay */}
                <div className="absolute bottom-3 right-4 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs text-slate-300 flex items-center gap-3 shadow-xl">
                  <span>Having trouble viewing the PDF directly?</span>
                  <button
                    type="button"
                    onClick={() => setViewMode('image')}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors"
                  >
                    Switch to Visual Page Reader
                  </button>
                  <a
                    href={book.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-lg hover:bg-white/10 text-amber-400"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <FileText className="w-16 h-16 text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-white mb-1">No Raw PDF File Attached</h3>
                <p className="text-xs text-slate-400 max-w-md mb-4">
                  The librarian has cataloged this academic textbook with the Visual Page Reader.
                  Click below to begin reading the curriculum content.
                </p>
                <button
                  type="button"
                  onClick={() => setViewMode('image')}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs shadow-md hover:bg-amber-300 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Open Visual Page Reader
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE 2: VISUAL PAGE / IMAGE-BASED ACADEMIC READER */}
        {viewMode === 'image' && (
          <div className={`flex-1 flex overflow-hidden ${currentTheme.bg}`}>
            {/* Sidebar / Chapter & Page Navigation Drawer */}
            {sidebarOpen && (
              <div
                className={`w-64 sm:w-72 shrink-0 border-r ${currentTheme.border} ${currentTheme.paperBg} p-4 overflow-y-auto flex flex-col justify-between transition-all z-10 shadow-lg`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> Table of Chapters
                    </h4>
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Page Thumbnails List */}
                  <div className="space-y-2">
                    {academicPages.map((pg) => {
                      const isCurrent = pg.pageNumber === currentPage;
                      const isBm = bookmarkedPages.includes(pg.pageNumber);
                      return (
                        <button
                          key={pg.pageNumber}
                          type="button"
                          onClick={() => handlePageChange(pg.pageNumber)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex items-start gap-2.5 cursor-pointer ${
                            isCurrent
                              ? 'border-amber-500 bg-amber-50/80 shadow-xs'
                              : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {pg.pageNumber}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-slate-900 truncate leading-snug">
                                {pg.chapterTitle}
                              </p>
                              {isBm && (
                                <BookmarkCheck className="w-3 h-3 text-amber-600 fill-amber-500 shrink-0 ml-1" />
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {pg.contentHeading}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Academic Summary Info */}
                <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Bookmarks:</span>
                    <span className="font-bold text-slate-800">{bookmarkedPages.length} saved</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Call Number:</span>
                    <span className="font-mono font-bold text-slate-800">{book.shelfNumber}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Main Interactive Academic Sheet Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start">
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className={`w-full max-w-3xl ${currentTheme.paperBg} ${currentTheme.border} ${currentTheme.text} rounded-2xl shadow-xl border p-6 sm:p-12 transition-all duration-150 space-y-6 relative`}
              >
                {/* Academic Page Header Stamp */}
                <div className={`flex items-center justify-between pb-4 border-b ${currentTheme.border} text-xs`}>
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[10px] opacity-75 block">
                      VVUC Academic Holdings • Curriculum Textbook
                    </span>
                    <h3 className="font-black text-sm sm:text-base mt-0.5">
                      {currentPageData.chapterTitle}
                    </h3>
                    {currentPageData.subtitle && (
                      <p className={`text-xs mt-0.5 ${currentTheme.subtext}`}>
                        {currentPageData.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-xs font-mono font-bold ${currentTheme.accentBg} ${currentTheme.accent}`}
                    >
                      Page {currentPageData.pageNumber} of {totalPages}
                    </span>
                    {bookmarkedPages.includes(currentPageData.pageNumber) && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold justify-end mt-1">
                        <BookmarkCheck className="w-3 h-3 fill-current" /> Bookmarked
                      </span>
                    )}
                  </div>
                </div>

                {/* Chapter Heading */}
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-black tracking-tight">
                    {currentPageData.contentHeading}
                  </h4>
                  <div className="h-1 w-12 bg-amber-500 rounded-full" />
                </div>

                {/* Paragraphs with clean typography */}
                <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-justify">
                  {currentPageData.paragraphs.map((para, i) => (
                    <p key={i} className="leading-6 sm:leading-7">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Special Highlight Box (Formula / Law / Concept) */}
                {currentPageData.highlightBox && (
                  <div
                    className={`p-4 rounded-xl border ${
                      currentPageData.highlightBox.type === 'formula'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
                        : currentPageData.highlightBox.type === 'case'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                        : `${currentTheme.accentBg} border-blue-200 dark:border-blue-800`
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {currentPageData.highlightBox.title}
                    </div>
                    <p className="text-xs sm:text-sm font-medium font-mono leading-relaxed">
                      {currentPageData.highlightBox.body}
                    </p>
                  </div>
                )}

                {/* Visual Technical Diagram (Figure / Graph / Architecture) */}
                {currentPageData.figureCaption && (
                  <div
                    className={`p-5 rounded-xl border ${currentTheme.border} ${currentTheme.bg} space-y-2 text-center`}
                  >
                    {currentPageData.figureType === 'flowchart' ? (
                      <div className="py-6 flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-xs font-bold">
                        <div className="px-3 py-2 rounded-lg bg-blue-900 text-white shadow-xs">
                          1. Theoretical Axioms
                        </div>
                        <span className="text-amber-500 font-black">➔</span>
                        <div className="px-3 py-2 rounded-lg bg-indigo-900 text-white shadow-xs">
                          2. Algorithmic Modeling
                        </div>
                        <span className="text-amber-500 font-black">➔</span>
                        <div className="px-3 py-2 rounded-lg bg-emerald-800 text-white shadow-xs">
                          3. Empirical Verification
                        </div>
                      </div>
                    ) : currentPageData.figureType === 'architecture' ? (
                      <div className="py-4 space-y-2 max-w-sm mx-auto">
                        <div className="p-2 rounded bg-blue-100 text-blue-950 font-mono text-xs font-bold border border-blue-300">
                          Application & Presentation Layer
                        </div>
                        <div className="p-2 rounded bg-indigo-100 text-indigo-950 font-mono text-xs font-bold border border-indigo-300">
                          Domain Business Logic & State Pipeline
                        </div>
                        <div className="p-2 rounded bg-slate-200 text-slate-900 font-mono text-xs font-bold border border-slate-300">
                          Immutable Ledger & Relational Storage Layer
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 flex items-center justify-center">
                        <div className="w-48 h-24 border-b-2 border-l-2 border-slate-400 relative flex items-end justify-between px-2 pb-1">
                          <div className="w-6 bg-blue-500 h-8 rounded-t" />
                          <div className="w-6 bg-blue-600 h-14 rounded-t" />
                          <div className="w-6 bg-blue-700 h-20 rounded-t" />
                          <div className="w-6 bg-amber-500 h-22 rounded-t" />
                        </div>
                      </div>
                    )}
                    <p className={`text-[11px] font-semibold ${currentTheme.subtext}`}>
                      {currentPageData.figureCaption}
                    </p>
                  </div>
                )}

                {/* Key Term Glossary definitions */}
                {currentPageData.keyTerms && currentPageData.keyTerms.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-dashed border-slate-200">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Key Terminology & Definitions:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {currentPageData.keyTerms.map((kt, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg ${currentTheme.bg} border ${currentTheme.border}`}
                        >
                          <span className="font-bold block">{kt.term}:</span>
                          <span className={`${currentTheme.subtext} text-[11px]`}>
                            {kt.definition}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Academic Sheet Footer */}
                <div
                  className={`pt-4 border-t ${currentTheme.border} flex items-center justify-between text-[10px] ${currentTheme.subtext}`}
                >
                  <span>Vidya Vikas Universal College • Central Academic Library</span>
                  <span>{book.isbn}</span>
                  <span>Page {currentPageData.pageNumber}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 3: STUDENT STUDY NOTES SCRATCHPAD */}
        {viewMode === 'notes' && (
          <div className="flex-1 bg-slate-900 p-4 sm:p-8 flex justify-center items-start overflow-y-auto">
            <div className="w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <StickyNote className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Personal Study Notes</h3>
                    <p className="text-[11px] text-slate-500">
                      Private notes saved locally for &quot;{book.title}&quot;
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {notesSavedNotice && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
                      <Check className="w-3.5 h-3.5" /> Saved!
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Save Notes
                  </button>
                </div>
              </div>

              <textarea
                value={studyNotes}
                onChange={(e) => setStudyNotes(e.target.value)}
                placeholder="Write your personal study summaries, key examination concepts, formula reminders, and citations here..."
                rows={14}
                className="w-full p-4 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span>Auto-stored in browser local storage.</span>
                <span className="font-mono">{studyNotes.length} characters</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Academic Citation Modal Overlay */}
      {showCitationModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Quote className="w-4 h-4 text-amber-500" />
                Academic Citations
              </h3>
              <button
                type="button"
                onClick={() => setShowCitationModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Copy standard bibliography citations for your college assignments and project reports:
            </p>

            {/* APA */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  APA (7th Edition)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(citations.apa, 'apa')}
                  className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
                >
                  {copiedCitation === 'apa' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedCitation === 'apa' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs font-serif text-slate-800 leading-snug">{citations.apa}</p>
            </div>

            {/* MLA */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  MLA (9th Edition)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(citations.mla, 'mla')}
                  className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
                >
                  {copiedCitation === 'mla' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedCitation === 'mla' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs font-serif text-slate-800 leading-snug">{citations.mla}</p>
            </div>

            {/* Chicago */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Chicago
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(citations.chicago, 'chicago')}
                  className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
                >
                  {copiedCitation === 'chicago' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedCitation === 'chicago' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs font-serif text-slate-800 leading-snug">{citations.chicago}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowCitationModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
