import React, { useState, useRef } from 'react';
import { Book } from '../../types';
import { addBook, updateBook, deleteBook } from '../../lib/libraryService';
import { useAuth } from '../../context/AuthContext';
import { EbookReaderModal } from '../common/EbookReaderModal';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Image as ImageIcon,
  MapPin,
  Eye,
  FileText,
  Upload,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface Props {
  books: Book[];
  onRefresh: () => void;
  onViewDetails: (book: Book) => void;
}

export const AdminBookManagement: React.FC<Props> = ({ books, onRefresh, onViewDetails }) => {
  const { adminProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [previewingBook, setPreviewingBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Book>>({
    title: '',
    author: '',
    isbn: '',
    bookId: '',
    subject: '',
    category: 'Computer Science',
    publisher: '',
    edition: '1st Edition',
    publicationYear: new Date().getFullYear(),
    totalCopies: 5,
    availableCopies: 5,
    shelfNumber: 'A-101',
    description: '',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    pdfUrl: '',
    hasEbook: false,
    ebookFileName: '',
    ebookFileSize: '',
  });

  const categories = Array.from(new Set(books.map((b) => b.category).filter(Boolean)));

  const handleOpenAdd = (withSampleEbook = false) => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      isbn: '978-' + Math.floor(1000000000 + Math.random() * 9000000000),
      bookId: 'BK-' + Math.floor(1000 + Math.random() * 9000),
      subject: '',
      category: 'Computer Science',
      publisher: 'Pearson Education',
      edition: '1st Edition',
      publicationYear: new Date().getFullYear(),
      totalCopies: 5,
      availableCopies: 5,
      shelfNumber: 'A-101',
      description: '',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      pdfUrl: withSampleEbook ? 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf' : '',
      hasEbook: withSampleEbook,
      ebookFileName: withSampleEbook ? 'Academic_Curriculum_Reference.pdf' : '',
      ebookFileSize: withSampleEbook ? '1.4 MB' : '',
    });
    setIsModalOpen(true);
    setFeedback(null);
  };

  const handleOpenEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({ ...book });
    setIsModalOpen(true);
    setFeedback(null);
  };

  const handlePdfFileSelect = (file: File) => {
    if (!file) return;
    const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFeedback({ type: 'error', message: 'Please upload a PDF (.pdf) softcopy document.' });
      return;
    }
    // Limit to 20MB for in-browser data URI
    if (file.size > 20 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'File is too large (max 20MB). For large textbooks, please provide a direct cloud or drive PDF URL below.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const formattedSize = file.size < 1024 * 1024 
        ? `${(file.size / 1024).toFixed(1)} KB` 
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      setFormData((prev) => ({
        ...prev,
        pdfUrl: base64,
        hasEbook: true,
        ebookFileName: file.name,
        ebookFileSize: formattedSize,
      }));
      setFeedback({ type: 'success', message: `Softcopy "${file.name}" (${formattedSize}) loaded and attached!` });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPdf(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPdf(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPdf(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePdfFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveSoftcopy = () => {
    setFormData((prev) => ({
      ...prev,
      pdfUrl: '',
      hasEbook: false,
      ebookFileName: '',
      ebookFileSize: '',
    }));
  };

  const handleLoadSamplePdf = () => {
    const title = formData.title ? formData.title.trim().replace(/\s+/g, '_') : 'Academic_Textbook';
    setFormData((prev) => ({
      ...prev,
      pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf',
      hasEbook: true,
      ebookFileName: `${title}_Digital_Softcopy.pdf`,
      ebookFileSize: '1.2 MB',
    }));
    setFeedback({ type: 'success', message: 'Sample academic e-book softcopy loaded!' });
  };

  const handleDelete = async (book: Book) => {
    if (!window.confirm(`Are you sure you want to delete "${book.title}" (ID: ${book.bookId})?`)) {
      return;
    }

    try {
      await deleteBook(book.id, adminProfile?.name || 'Chief Librarian');
      setFeedback({ type: 'success', message: `Book "${book.title}" removed from catalog.` });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete book.' });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const sanitizedCover = formData.coverImage && formData.coverImage.trim() 
        ? formData.coverImage.trim() 
        : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
      const payload: Partial<Book> = {
        ...formData,
        coverImage: sanitizedCover,
        hasEbook: Boolean(formData.pdfUrl && formData.pdfUrl.trim() !== ''),
        pdfUrl: formData.pdfUrl?.trim() || '',
        ebookFileName: formData.ebookFileName || '',
        ebookFileSize: formData.ebookFileSize || '',
      };

      if (editingBook) {
        await updateBook(editingBook.id, payload, adminProfile?.name || 'Chief Librarian');
        setFeedback({ type: 'success', message: 'Book updated successfully!' });
      } else {
        await addBook(payload as any, adminProfile?.name || 'Chief Librarian');
        setFeedback({ type: 'success', message: 'New book added to library catalog!' });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error saving book.' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = books.filter((b) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      b.title.toLowerCase().includes(term) ||
      b.author.toLowerCase().includes(term) ||
      b.bookId.toLowerCase().includes(term) ||
      b.isbn.toLowerCase().includes(term) ||
      b.subject.toLowerCase().includes(term);

    const matchesCategory = categoryFilter === 'all' || b.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Library Book Holdings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add new academic textbooks, attach digital softcopies (PDFs), update shelf positions, and track physical copies
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            id="admin-btn-add-ebook"
            onClick={() => handleOpenAdd(true)}
            className="px-3.5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Add E-Book / PDF Softcopy
          </button>

          <button
            type="button"
            id="admin-btn-add-book"
            onClick={() => handleOpenAdd(false)}
            className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Book
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <p className="font-semibold">{feedback.message}</p>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Title, Author, Book ID (e.g. BK-1001), or ISBN..."
            className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50/50"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="all">All Disciplines ({books.length})</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Book Code</th>
                <th className="p-3.5">Title & Author</th>
                <th className="p-3.5">Discipline</th>
                <th className="p-3.5">Shelf Location</th>
                <th className="p-3.5 text-center">Available / Total</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((book) => {
                const isAvail = book.availableCopies > 0;
                return (
                  <tr key={book.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-700">{book.bookId}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={book.coverImage && book.coverImage.trim() ? book.coverImage.trim() : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                          alt={book.title}
                          className="w-8 h-11 object-cover rounded shadow-2xs shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const fallback = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
                            if (target.src !== fallback) {
                              target.src = fallback;
                            }
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-slate-900 leading-snug">{book.title}</p>
                            {book.pdfUrl && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <FileText className="w-3 h-3" /> E-Book PDF
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {book.author} • {book.edition} ({book.publicationYear})
                            {book.ebookFileSize ? ` • ${book.ebookFileSize}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-semibold text-[10px]">
                        {book.category}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono text-slate-700 font-semibold">{book.shelfNumber}</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {book.availableCopies} / {book.totalCopies}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {book.pdfUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewingBook(book)}
                            className="p-1.5 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                            title="Read / Preview E-Book Softcopy"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(book)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                            title="Attach PDF Softcopy"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onViewDetails(book)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-slate-100"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(book)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                          title="Edit Book"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(book)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50"
                          title="Delete Book"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingBook ? `Edit Book: ${editingBook.title}` : 'Add New Library Book'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Book Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Artificial Intelligence: A Modern Approach"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Author(s) *</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="e.g. Stuart Russell and Peter Norvig"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Book Code (ID) *</label>
                  <input
                    type="text"
                    required
                    value={formData.bookId}
                    onChange={(e) => setFormData({ ...formData, bookId: e.target.value })}
                    placeholder="e.g. BK-1001"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ISBN Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="e.g. 978-0134610993"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Curriculum Area *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Machine Learning & Expert Systems"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category / Discipline *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Commerce & Accounting">Commerce & Accounting</option>
                    <option value="Management Studies">Management Studies</option>
                    <option value="Humanities & Economics">Humanities & Economics</option>
                    <option value="Reference & Periodicals">Reference & Periodicals</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Publisher *</label>
                  <input
                    type="text"
                    required
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    placeholder="e.g. Pearson, Oxford Press, McGraw Hill"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Edition</label>
                  <input
                    type="text"
                    value={formData.edition}
                    onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                    placeholder="e.g. 4th Global Edition"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Publication Year</label>
                  <input
                    type="number"
                    value={formData.publicationYear}
                    onChange={(e) => setFormData({ ...formData, publicationYear: parseInt(e.target.value) || 2024 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Copies *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.totalCopies}
                    onChange={(e) => {
                      const total = parseInt(e.target.value) || 1;
                      setFormData({
                        ...formData,
                        totalCopies: total,
                        availableCopies: editingBook ? formData.availableCopies : total,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Available Copies *</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.totalCopies}
                    required
                    value={formData.availableCopies}
                    onChange={(e) => setFormData({ ...formData, availableCopies: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shelf Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.shelfNumber}
                    onChange={(e) => setFormData({ ...formData, shelfNumber: e.target.value })}
                    placeholder="e.g. CS-04-B"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Scope</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of book curriculum and topics covered..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Dedicated Softcopy / PDF E-Book Section */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-purple-950 flex items-center gap-2">
                          Digital Softcopy / E-Book (PDF)
                          <span className="text-[10px] font-normal text-purple-600 bg-purple-100/70 px-2 py-0.5 rounded-full">
                            Online Student Reading
                          </span>
                        </h4>
                        <p className="text-[11px] text-purple-700">
                          Upload a textbook PDF or enter a softcopy document link for students to read online.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleLoadSamplePdf}
                        className="px-2.5 py-1 text-[11px] font-semibold text-purple-700 bg-white border border-purple-200 hover:bg-purple-100/60 rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        title="Load verified open-access sample academic PDF for testing"
                      >
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        Sample Academic PDF
                      </button>
                    </div>
                  </div>

                  {/* Drag-and-drop & File Selector Box */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all ${
                      isDraggingPdf
                        ? 'border-purple-600 bg-purple-100/80 scale-[1.01]'
                        : 'border-purple-300 hover:border-purple-400 bg-white'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handlePdfFileSelect(e.target.files[0]);
                        }
                      }}
                      accept="application/pdf,.pdf,application/epub+zip"
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="text-xs text-slate-700 font-medium">
                          Drag & drop PDF here, or
                        </span>
                      </div>

                      <button
                        type="button"
                        id="admin-btn-browse-pdf"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Softcopy / PDF File
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Accepts standard textbook PDFs (up to 20MB in-browser) or enter external link below
                    </p>
                  </div>

                  {/* Attached File Preview or Direct URL Input */}
                  {formData.pdfUrl ? (
                    <div className="p-3 bg-white rounded-xl border border-purple-200 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {formData.ebookFileName || 'Attached_Softcopy_Document.pdf'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {formData.ebookFileSize || 'Digital Document'} • Ready for Student Reading
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewingBook({
                              ...(formData as Book),
                              id: editingBook?.id || 'preview-temp',
                              title: formData.title || 'Untitled Book',
                              author: formData.author || 'Author',
                              pdfUrl: formData.pdfUrl,
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3" />
                          Test Read
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveSoftcopy}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Direct PDF Link Input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                      Or Direct Web / Drive PDF URL (Cloud Storage, College Drive, or Open Library):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.pdfUrl?.startsWith('data:') ? '' : formData.pdfUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            pdfUrl: val,
                            hasEbook: Boolean(val.trim()),
                            ebookFileName: val ? 'Web_Linked_Ebook.pdf' : '',
                            ebookFileSize: val ? 'Cloud PDF' : '',
                          }));
                        }}
                        placeholder="https://example.com/books/sample-textbook.pdf or Google Drive PDF view link"
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-purple-200 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {editingBook ? 'Save Book Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E-Book Softcopy Reader Modal */}
      <EbookReaderModal
        book={previewingBook}
        isOpen={Boolean(previewingBook)}
        onClose={() => setPreviewingBook(null)}
      />
    </div>
  );
};
