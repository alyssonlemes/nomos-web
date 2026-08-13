import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2, Send, Sparkles } from 'lucide-react';
import type { ChatHistoricoItem } from '@/services/jurimetria.service';
import { UserService } from '@/services/user.service';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function Jurimetria() {
  const currentUser = UserService.getStoredUser();
  const userInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Olá! Sou o assistente de jurimetria da Nomos. Faça perguntas sobre processos, probabilidades, tempos médios ou tendências que eu te ajudo a analisar.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
      const { JurimétriaService } = await import('@/services/jurimetria.service');

      // Montar histórico: todas as mensagens exceto a mensagem de boas-vindas (id='welcome')
      // e exceto a mensagem atual (já adicionada acima)
      const historico: ChatHistoricoItem[] = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const resultado = await JurimétriaService.chat(userMessage.content, historico);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: resultado.resposta,
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
            {/* Área de mensagens: flex-1 + min-h-0 permite encolher dentro do flex pai */}
            {/* sem min-h-0 o flex item nunca encolhe abaixo do tamanho do conteúdo */}
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
                    {renderContent(message.content)}
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
