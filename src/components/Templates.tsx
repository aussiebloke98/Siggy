import { useState } from 'react';
import { FileText, Plus, Trash2, Mail, MessageSquare, X, Save } from 'lucide-react';
import type { Template, Channel } from '@/types';
import { useTemplates } from '@/hooks/useData';

export function Templates() {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<Channel>('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const openNew = () => {
    setEditing(null);
    setName('Untitled Template');
    setChannel('email');
    setSubject('');
    setBody('');
    setShowEditor(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setName(t.name);
    setChannel(t.channel);
    setSubject(t.subject);
    setBody(t.body);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (editing) {
      await updateTemplate(editing.id, { name, channel, subject, body });
    } else {
      await createTemplate({ name, channel, subject, body });
    }
    setShowEditor(false);
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Message Templates</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Reusable message templates with merge fields
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Template grid */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)] text-sm">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
          <p className="text-sm text-[var(--text-muted)] mb-3">No templates yet. Create one to get started.</p>
          <button
            onClick={openNew}
            className="text-sm text-[var(--accent-light)] hover:underline"
          >
            Create your first template →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className="glass-card rounded-xl p-5 hover:border-[var(--border-light)] transition-all duration-200 cursor-pointer group"
              onClick={() => openEdit(t)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  t.channel === 'email' ? 'bg-blue-500/10' : 'bg-cyan-500/10'
                }`}>
                  {t.channel === 'email' ? (
                    <Mail className="w-4 h-4 text-blue-400" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}
                  className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-sm font-semibold mb-1 truncate">{t.name}</h3>
              {t.subject && (
                <p className="text-xs text-[var(--text-secondary)] mb-2 truncate">{t.subject}</p>
              )}
              <p className="text-xs text-[var(--text-muted)] line-clamp-2">{t.body}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] uppercase">
                  {t.channel}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in" onClick={() => setShowEditor(false)}>
          <div
            className="w-full max-w-2xl glass-card rounded-2xl p-6 gradient-border max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{editing ? 'Edit Template' : 'New Template'}</h3>
              <button onClick={() => setShowEditor(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Template Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Channel</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChannel('email')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                      channel === 'email'
                        ? 'bg-[var(--accent-glow)] border-[var(--accent)] text-[var(--accent-light)]'
                        : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <Mail className="w-4 h-4" /> Email
                  </button>
                  <button
                    onClick={() => setChannel('sms')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                      channel === 'sms'
                        ? 'bg-[var(--accent-glow)] border-[var(--accent)] text-[var(--accent-light)]'
                        : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" /> SMS
                  </button>
                </div>
              </div>

              {channel === 'email' && (
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Subject Line</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Hello {{name}}, important update inside"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Message Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  placeholder="Hi {{name}},&#10;&#10;We wanted to reach out regarding {{company}}..."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--accent)] resize-none"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1.5">
                  Use <code className="text-[var(--accent-light)]">{`{{name}}`}</code>, <code className="text-[var(--accent-light)]">{`{{email}}`}</code>, <code className="text-[var(--accent-light)]">{`{{company}}`}</code> for merge fields
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-sm font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                {editing ? 'Update' : 'Create'} Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
