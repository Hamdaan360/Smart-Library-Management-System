import React, { useState, useMemo } from 'react';
import { Book } from '../../types';
import { Search, Filter, BookOpen, CheckCircle2, XCircle, ArrowUpDown, ChevronDown, Layers, MapPin, FileText } from 'lucide-react';
import { StudentEbookReaderModal } from '../student/StudentEbookReaderModal';

interface Props {
  books: Book[];
  onSelectBook: (book: Book) => void;
  title?: string;
  subtitle?: string;
}

export const BookCatalog: React.FC<Props> = ({
  books,
  onSelectBook,
  title = 'College Library Catalog',
  subtitle = 'Search and discover books across all academic disciplines',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'year' | 'available'>('title');
  const [selectedEbook, setSelectedEbook] = useState<Book | null>(null);

  // Derive categories and subjects dynamically
  const categories = useMemo(() => {
    const set = new Set(books.map((b) => b.category).filter(Boolean));
    return Array.from(set).sort();
  }, [books]);

  const subjects = useMemo(() => {
    const list = selectedCategory === 'all'
      ? books
      : books.filter((b) => b.category === selectedCategory);
    const set = new Set(list.map((b) => b.subject).filter(Boolean));
    return Array.from(set).sort();
  }, [books, selectedCategory]);

  // Filtering logic
  const filteredBooks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return books
      .filter((book) => {
        // Search term matches: title, author, isbn, bookId, subject, category
        const matchesSearch =
          !term ||
          book.title.toLowerCase().includes(term) ||
          book.author.toLowerCase().includes(term) ||
          book.isbn.toLowerCase().includes(term) ||
          book.bookId.toLowerCase().includes(term) ||
          book.subject.toLowerCase().includes(term) ||
          book.category.toLowerCase().includes(term);

        // Category filter
        const matchesCat = selectedCategory === 'all' || book.category === selectedCategory;

        // Subject filter
        const matchesSub = selectedSubject === 'all' || book.subject === selectedSubject;

        // Availability filter
        const matchesAvail =
          availabilityFilter === 'all' ||
          (availabilityFilter === 'available' && book.availableCopies > 0) ||
          (availabilityFilter === 'unavailable' && book.availableCopies === 0);

        return matchesSearch && matchesCat && matchesSub && matchesAvail;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'author') return a.author.localeCompare(b.author);
        if (sortBy === 'year') return (b.publicationYear || 0) - (a.publicationYear || 0);
        if (sortBy === 'available') return (b.availableCopies || 0) - (a.availableCopies || 0);
        return 0;
      });
  }, [books, searchTerm, selectedCategory, selectedSubject, availabilityFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg self-start md:self-auto">
          Showing <span className="text-slate-900 font-bold">{filteredBooks.length}</span> of {books.length} titles
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Title, Author, ISBN, Book ID (e.g. BK-1001), Subject or Category..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter chips & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubject('all');
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Categories ({books.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Availability</label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Copies</option>
              <option value="available">Available on Shelf Only</option>
              <option value="unavailable">Out of Stock / Reserved</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="title">Title (A-Z)</option>
              <option value="author">Author Name</option>
              <option value="year">Latest Publication Year</option>
              <option value="available">Most Copies Available</option>
            </select>
          </div>
        </div>
      </div>

      {/* Book Grid */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching books found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords, category filters, or availability options.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedSubject('all');
              setAvailabilityFilter('all');
            }}
            className="mt-4 px-4 py-1.5 rounded-lg bg-blue-50 text-blue-900 font-semibold text-xs hover:bg-blue-100 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredBooks.map((book) => {
            const isAvail = book.availableCopies > 0;
            return (
              <div
                key={book.id}
                onClick={() => onSelectBook(book)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col cursor-pointer group"
              >
                {/* Image Cover Container */}
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  <img
                    src={book.coverImage && book.coverImage.trim() ? book.coverImage.trim() : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs ${
                        isAvail ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      {isAvail ? `${book.availableCopies} in Stock` : 'Out of Stock'}
                    </span>
                  </div>
                  {book.pdfUrl && (
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-700 text-white shadow-xs">
                        <FileText className="w-2.5 h-2.5" /> E-Book PDF
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900/80 text-white backdrop-blur-xs">
                      Shelf {book.shelfNumber}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                        {book.category}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{book.bookId}</span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-blue-900 transition-colors leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-1 font-medium">{book.author}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{book.subject}</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">
                      ISBN: {book.isbn.substring(0, 10)}...
                    </span>
                    <div className="flex items-center gap-2">
                      {book.pdfUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEbook(book);
                          }}
                          className="px-2 py-0.5 rounded-md bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Read softcopy PDF online"
                        >
                          <BookOpen className="w-3 h-3" />
                          Read
                        </button>
                      )}
                      <span className="font-bold text-blue-900 group-hover:underline">View Details</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Softcopy E-Book Reader Modal */}
      <StudentEbookReaderModal
        book={selectedEbook}
        isOpen={Boolean(selectedEbook)}
        onClose={() => setSelectedEbook(null)}
      />
    </div>
  );
};
