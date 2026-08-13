import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { JurimetriaService, type ChatHistoricoItem } from '@/services/jurimetria.service';
import { UserService } from '@/services/user.service';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  animate?: boolean;
};

interface TextSegment {
  type: 'text' | 'bold' | 'italic';
  content: string;
  charCount: number;
}

interface TextLine {
  segments: TextSegment[];
}

/** Utilitário para contar caracteres Unicode (pontos de código) */
function getCharCount(str: string): number {
  return Array.from(str).length;
}

/** Utilitário para fatiar caracteres Unicode sem quebrar pares substitutos */
function sliceChars(str: string, length: number): string {
  return Array.from(str).slice(0, length).join('');
}

/** Transforma markdown simples em AST estruturada por linhas e segmentos */
function parseFormattedText(text: string): { lines: TextLine[]; totalLength: number } {
  const rawLines = text.split('\n');
  let totalLength = 0;

  const lines: TextLine[] = rawLines.map((line, lineIdx) => {
    const rawTokens = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    const segments: TextSegment[] = [];

    for (const token of rawTokens) {
      if (!token) continue;
      if (token.startsWith('**') && token.endsWith('**')) {
        const content = token.slice(2, -2);
        const charCount = getCharCount(content);
        segments.push({ type: 'bold', content, charCount });
        totalLength += charCount;
      } else if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
        const content = token.slice(1, -1);
        const charCount = getCharCount(content);
        segments.push({ type: 'italic', content, charCount });
        totalLength += charCount;
      } else {
        const charCount = getCharCount(token);
        segments.push({ type: 'text', content: token, charCount });
        totalLength += charCount;
      }
    }

    if (lineIdx < rawLines.length - 1) {
      totalLength += 1;
    }

    return { segments };
  });

  return { lines, totalLength };
}

/** Renderiza a AST de acordo com a quantidade de caracteres visíveis */
function renderFormattedAST(lines: TextLine[], visibleLength: number, isTyping: boolean) {
  let charCounter = 0;

  return (
    <>
      {lines.map((line, lineIdx) => {
        if (charCounter >= visibleLength && visibleLength < Infinity) {
          return null;
        }

        const lineElements: React.ReactNode[] = [];

        for (let segIdx = 0; segIdx < line.segments.length; segIdx++) {
          const seg = line.segments[segIdx];
          const remainingChars = visibleLength - charCounter;

          if (remainingChars <= 0) break;

          const sliceLength = Math.min(seg.charCount, remainingChars);
          const slicedContent = sliceChars(seg.content, sliceLength);
          charCounter += sliceLength;

          const key = `${lineIdx}-${segIdx}`;
          if (seg.type === 'bold') {
            lineElements.push(<strong key={key}>{slicedContent}</strong>);
          } else if (seg.type === 'italic') {
            lineElements.push(<em key={key}>{slicedContent}</em>);
          } else {
            lineElements.push(<span key={key}>{slicedContent}</span>);
          }
        }

        const hasNewline = lineIdx < lines.length - 1;
        let showNewline = false;
        if (hasNewline) {
          if (charCounter < visibleLength) {
            charCounter += 1;
            showNewline = true;
          }
        }

        return (
          <span key={lineIdx}>
            {lineElements}
            {showNewline && <br />}
          </span>
        );
      })}

      {isTyping && (
        <span className="inline-block w-1.5 h-3.5 bg-primary/80 ml-1 align-middle animate-pulse rounded-sm" />
      )}
    </>
  );
}

/** Componente de efeito máquina de escrever para a mensagem do assistente */
function TypewriterMessage({
  content,
  animate = true,
  onType,
}: {
  content: string;
  animate?: boolean;
  onType?: () => void;
}) {
  const { lines, totalLength } = parseFormattedText(content);
  const [visibleLength, setVisibleLength] = useState(animate ? 0 : totalLength);

  useEffect(() => {
    if (!animate) {
      setVisibleLength(totalLength);
      return;
    }

    setVisibleLength(0);

    // Passo ajustado para finalizar a animação em ~1.5 a 2.5s
    const step = Math.max(1, Math.ceil(totalLength / 120));
    const intervalTime = 15;

    const interval = setInterval(() => {
      setVisibleLength((prev) => {
        const next = prev + step;
        if (next >= totalLength) {
          clearInterval(interval);
          return totalLength;
        }
        return next;
      });
      if (onType) onType();
    }, intervalTime);

    return () => clearInterval(interval);
  }, [content, animate, totalLength]);

  const isTyping = animate && visibleLength < totalLength;

  return renderFormattedAST(lines, visibleLength, isTyping);
}

export default function Jurimetria() {
  const currentUser = UserService.getStoredUser();
  const userInitial = currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Olá! Sou o assistente de jurimetria da Nomos. Faça perguntas sobre processos, probabilidades, tempos médios ou tendências que eu te ajudo a analisar.\n\n💡 **Para analisar um processo**, basta me mandar o número no padrão CNJ e o tribunal (ex: *5001234-56.2023.8.21.0001 no TJRS*).',
      animate: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const historico: ChatHistoricoItem[] = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const resultado = await JurimetriaService.chat(userMessage.content, historico);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: resultado.resposta,
        animate: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content:
          error instanceof Error
            ? `⚠️ ${error.message}`
            : '⚠️ Ocorreu um erro ao processar sua mensagem. Tente novamente.',
        animate: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /** Tokeniza uma linha em spans com negrito e itálico */
  const renderInline = (text: string, baseKey: string) => {
    const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return tokens.map((token, i) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return <strong key={`${baseKey}-b${i}`}>{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
        return <em key={`${baseKey}-i${i}`}>{token.slice(1, -1)}</em>;
      }
      return <span key={`${baseKey}-t${i}`}>{token}</span>;
    });
  };

  /** Renderiza texto com suporte a **negrito**, *itálico* e quebras de linha */
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => (
      <span key={lineIdx}>
        {renderInline(line, String(lineIdx))}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-4 w-full flex-1 min-h-0">
        <div className="flex items-center justify-between gap-3 mb-2 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Jurimetria
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Faça perguntas em linguagem natural e explore insights sobre seus processos.
            </p>
          </div>
        </div>

        <Card className="flex flex-col flex-1 min-h-0 bg-background/60 backdrop-blur border-border/60">
          <CardHeader className="pb-3 border-b border-border/60 shrink-0">
            <CardTitle className="text-base font-semibold text-muted-foreground flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Assistente de Jurimetria
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col flex-1 min-h-0 pt-4 gap-4">
            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 pb-2"
              style={{ scrollbarGutter: 'stable' }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn('shrink-0 flex w-full items-end gap-2', {
                    'justify-end': message.role === 'user',
                    'justify-start': message.role === 'assistant',
                  })}
                >
                  {/* Avatar do assistente */}
                  {message.role === 'assistant' && (
                    <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-0.5 select-none">
                      N
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-foreground border border-border rounded-bl-none'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <TypewriterMessage
                        content={message.content}
                        animate={message.animate !== false}
                        onType={scrollToBottom}
                      />
                    ) : (
                      renderContent(message.content)
                    )}
                  </div>

                  {/* Avatar do usuário */}
                  {message.role === 'user' && (
                    <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-muted border border-border text-xs font-bold mb-0.5 select-none text-foreground">
                      {userInitial}
                    </div>
                  )}
                </div>
              ))}

              {isSending && (
                <div className="shrink-0 flex justify-start items-end gap-2">
                  <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-0.5 select-none">
                    N
                  </div>
                  <div className="bg-muted border border-border rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analisando...
                  </div>
                </div>
              )}
            </div>

            {/* Input fixo na parte inferior */}
            <form
              className="shrink-0 flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3 py-2 shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua dúvida ou informe um processo ex: 5001234-56.2023.8.21.0001 no TJRS"
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isSending}
                className="rounded-full h-9 w-9 shadow-sm"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
