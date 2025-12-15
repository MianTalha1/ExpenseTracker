/**
 * Chat Page
 * GPT-like AI chat interface for finance conversations
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  DollarSign,
  PiggyBank,
  TrendingUp,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button, Input, Spinner } from '@/components/atoms';
import { useChat } from '@/lib/hooks';
import { cn } from '@/lib/utils/cn';
import type { ChatMessage } from '@casha/shared';

const QUICK_SUGGESTIONS = [
  { icon: DollarSign, text: 'How can I reduce my monthly expenses?' },
  { icon: PiggyBank, text: 'Tips for building an emergency fund' },
  { icon: TrendingUp, text: 'How should I start investing?' },
];

export function ChatPage() {
  const {
    messages,
    streamingContent,
    isStreaming,
    error,
    sendMessage,
  } = useChat();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const message = input;
    setInput('');
    await sendMessage(message);
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0 && !streamingContent;

  return (
    <div className="h-[calc(100vh-140px)] lg:h-[calc(100vh-80px)] flex animate-in slide-in-up">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center p-6">
              <div className="p-4 bg-casha-primary/10 rounded-full mb-4">
                <Sparkles className="h-8 w-8 text-casha-primary" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Casha AI
              </h2>
              <p className="text-text-secondary text-center max-w-md mb-8">
                Your personal finance assistant. Ask me about budgeting, saving money, investments, or expense tracking.
              </p>

              {/* Quick Suggestions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
                {QUICK_SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-bento-sm border border-border',
                      'hover:bg-surface-muted hover:border-border-hover transition-colors',
                      'text-left text-sm text-text-secondary'
                    )}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                  >
                    <suggestion.icon className="h-4 w-4 text-casha-primary flex-shrink-0" />
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="max-w-3xl mx-auto p-4 space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {/* Streaming Message */}
              {streamingContent && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 p-2 bg-casha-primary/10 rounded-full h-fit">
                    <Bot className="h-4 w-4 text-casha-primary" />
                  </div>
                  <div className="flex-1 bg-surface-muted rounded-bento p-3">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-text-primary">
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !match && !String(children).includes('\n');
                            return isInline ? (
                              <code className="bg-surface px-1.5 py-0.5 rounded text-sm font-mono text-casha-primary" {...props}>
                                {children}
                              </code>
                            ) : (
                              <SyntaxHighlighter style={oneDark} language={match?.[1] || 'text'} PreTag="div" className="rounded-bento-sm !my-2 text-sm">
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            );
                          },
                          p({ children }) {
                            return <p className="mb-2 last:mb-0">{children}</p>;
                          },
                        }}
                      >
                        {streamingContent}
                      </ReactMarkdown>
                      <span className="inline-block w-1.5 h-4 ml-1 bg-casha-primary animate-pulse align-middle" />
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-bento-sm">
                  <p className="text-sm text-error">{error.message}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Fixed above bottom navbar on mobile */}
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 border-t border-border p-4 bg-surface lg:relative lg:bottom-0 lg:left-auto lg:right-auto lg:z-auto">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about budgeting, saving, investments..."
                disabled={isStreaming}
                className="flex-1"
              />
              <Button
                variant="primary"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="rounded-full w-12 h-12 min-w-12 flex-shrink-0"
              >
                {isStreaming ? (
                  <Spinner size="sm" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Message Bubble Component
 * Renders user messages as plain text, assistant messages with markdown
 */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex-shrink-0 p-2 rounded-full h-fit',
          isUser ? 'bg-surface-muted' : 'bg-casha-primary/10'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-text-muted" />
        ) : (
          <Bot className="h-4 w-4 text-casha-primary" />
        )}
      </div>
      <div
        className={cn(
          'flex-1 rounded-bento p-3 max-w-[85%]',
          isUser ? 'bg-casha-primary text-white ml-auto' : 'bg-surface-muted'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-text-primary prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-li:text-text-primary">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !String(children).includes('\n');

                  return isInline ? (
                    <code
                      className="bg-surface px-1.5 py-0.5 rounded text-sm font-mono text-casha-primary"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match?.[1] || 'text'}
                      PreTag="div"
                      className="rounded-bento-sm !my-2 text-sm"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  );
                },
                ul({ children }) {
                  return <ul className="list-disc pl-4 space-y-1">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-4 space-y-1">{children}</ol>;
                },
                li({ children }) {
                  return <li className="text-text-primary">{children}</li>;
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
                strong({ children }) {
                  return <strong className="font-semibold text-text-primary">{children}</strong>;
                },
                h1({ children }) {
                  return <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-base font-semibold mt-3 mb-2">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
