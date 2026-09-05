import { useState, useRef, useCallback } from 'react';
import {
  Users,
  Upload,
  Search,
  Trash2,
  Download,
  FileUp,
  X,
  CheckCircle2,
} from 'lucide-react';
import type { Contact } from '@/types';
import { useContacts } from '@/hooks/useData';
import { parseContacts, detectFormat, type ParsedContact } from '@/lib/csvParser';

export function Contacts() {
  const { contacts, loading, importContacts, deleteContact } = useContacts();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');
  const [importPreview, setImportPreview] = useState<ParsedContact[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = contacts.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const fmt = detectFormat(file.name);
      setImportFormat(fmt);
      setImportText(text);
      try {
        setImportPreview(parseContacts(text, fmt));
      } catch {
        setImportPreview([]);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleTextChange = (text: string) => {
    setImportText(text);
    try {
      setImportPreview(parseContacts(text, importFormat));
    } catch {
      setImportPreview([]);
    }
  };

  const handleImport = async () => {
    if (importPreview.length === 0) return;
    setImporting(true);
    const count = await importContacts(importPreview, 'file-import');
    setImporting(false);
    setImportResult(count);
    if (count > 0) {
      setTimeout(() => {
        setShowImport(false);
        setImportText('');
        setImportPreview([]);
        setImportResult(null);
      }, 2000);
    }
  };

  const downloadSampleCSV = () => {
    const sample = `name,email,phone,company,tags
John Smith,john@acme.com,+1234567890,Acme Corp;VIP;Enterprise
Jane Doe,jane@tech.io,+1987654321,TechIO;Startup
Bob Johnson,bob@retail.com,+15551234567,RetailCo;Customer
Alice Lee,alice@finance.org,+14445556666,FinanceOrg;VIP`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_contacts.csv';
    a.click();
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contacts</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {contacts.length} contacts in database
          </p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import Contacts
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
          <option value="bounced">Bounced</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm">Loading contacts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm text-[var(--text-muted)]">
              {contacts.length === 0 ? 'No contacts yet. Import a contact list to get started.' : 'No contacts match your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left">
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)] text-xs uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)] text-xs uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)] text-xs uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)] text-xs uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)] text-xs uppercase tracking-wider">Tags</th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)] text-xs uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors group">
                    <td className="px-4 py-3 font-medium">{c.name || '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-xs">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{c.company || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags ?? []).map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        c.status === 'active' ? 'text-emerald-400'
                        : c.status === 'unsubscribed' ? 'text-amber-400'
                        : 'text-red-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteContact(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in" onClick={() => setShowImport(false)}>
          <div
            className="w-full max-w-2xl glass-card rounded-2xl p-6 gradient-border max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-[var(--accent-light)]" />
                <h3 className="text-lg font-semibold">Import Contacts</h3>
              </div>
              <button onClick={() => setShowImport(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-sm hover:border-[var(--accent)] transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload File
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <button
                onClick={downloadSampleCSV}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-sm hover:border-[var(--accent)] transition-colors"
              >
                <Download className="w-4 h-4" />
                Sample CSV
              </button>
              <div className="ml-auto flex items-center gap-1 text-xs">
                <span className="text-[var(--text-muted)]">Format:</span>
                <button
                  onClick={() => { setImportFormat('csv'); setImportPreview(importText ? parseContacts(importText, 'csv') : []); }}
                  className={`px-2 py-1 rounded ${importFormat === 'csv' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)]'}`}
                >CSV</button>
                <button
                  onClick={() => { setImportFormat('json'); setImportPreview(importText ? parseContacts(importText, 'json') : []); }}
                  className={`px-2 py-1 rounded ${importFormat === 'json' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)]'}`}
                >JSON</button>
              </div>
            </div>

            <textarea
              value={importText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={
                importFormat === 'csv'
                  ? 'name,email,phone,company,tags\nJohn Doe,john@example.com,+1234567890,Acme,VIP'
                  : '[{"name":"John","email":"john@example.com","phone":"+123","company":"Acme","tags":["VIP"]}]'
              }
              rows={6}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
            />

            {importPreview.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-[var(--text-secondary)] mb-2">
                  Preview: {importPreview.length} contacts detected
                </p>
                <div className="max-h-32 overflow-y-auto rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] p-2">
                  {importPreview.slice(0, 5).map((c, i) => (
                    <div key={i} className="text-xs py-1 px-2 text-[var(--text-secondary)]">
                      {c.name} · {c.email} · {c.company}
                    </div>
                  ))}
                  {importPreview.length > 5 && (
                    <div className="text-xs text-[var(--text-muted)] px-2 py-1">...and {importPreview.length - 5} more</div>
                  )}
                </div>
              </div>
            )}

            {importResult !== null && (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Successfully imported {importResult} contacts
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importPreview.length === 0 || importing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                {importing ? 'Importing...' : `Import ${importPreview.length} Contacts`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
