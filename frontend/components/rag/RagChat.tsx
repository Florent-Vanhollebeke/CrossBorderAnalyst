'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Bot, User, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Source {
  // Champs retournés par rag_fiscal.py
  description?: string;
  doc_type?: string;
  canton?: string;
  source?: string;
  // Champs génériques (compatibilité)
  title?: string;
  type?: string;
  city?: string;
  url?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  from_rag?: boolean;
}

export function RagChat() {
  const t = useTranslations('advisor');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    t('suggested_q1'),
    t('suggested_q2'),
    t('suggested_q3'),
    t('suggested_q4'),
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(question: string) {
    if (!question.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const resp = await fetch(`${apiUrl}/api/v1/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!resp.ok) throw new Error(`${resp.status}`);
      const data = await resp.json();

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources ?? [], from_rag: data.from_rag ?? false },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('error') },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function toggleSources(idx: number) {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
          <Bot className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{t('chat_title')}</p>
          <p className="text-xs text-gray-500">{t('chat_subtitle')}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <Bot className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <p className="text-base font-medium text-gray-800">{t('suggested_title')}</p>
              <p className="mt-1 text-sm text-gray-500">{t('suggested_hint')}</p>
            </div>
            <div className="grid w-full max-w-lg gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  msg.role === 'user' ? 'bg-brand-600' : 'bg-emerald-100'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-emerald-600" />
                )}
              </div>
              <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
                <div className="flex items-center gap-2">
                  {msg.from_rag !== undefined && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      msg.from_rag
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {msg.from_rag ? '📄 Base documentaire' : '🧠 Connaissance Claude'}
                    </span>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <button
                      onClick={() => toggleSources(idx)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      {expandedSources.has(idx) ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
                {msg.sources && msg.sources.length > 0 && expandedSources.has(idx) && (
                  <ul className="mt-1 space-y-1">
                    {msg.sources.map((src, sIdx) => (
                      <li
                        key={sIdx}
                        className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600"
                      >
                        <p className="font-medium text-gray-800">
                          {src.title || src.description || src.doc_type || src.type || 'Source'}
                        </p>
                        {(src.canton || src.city) && (
                          <p className="mt-0.5 text-gray-400">Canton : {src.canton || src.city}</p>
                        )}
                        {src.url ? (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 block truncate text-emerald-600 hover:underline font-mono"
                          >
                            {src.url}
                          </a>
                        ) : src.source ? (
                          <p className="mt-0.5 text-gray-400 font-mono">{src.source}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Bot className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading')}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-4 py-3">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('placeholder')}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50"
          />
          <Button type="submit" disabled={!input.trim() || loading} size="md">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
