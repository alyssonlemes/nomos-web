import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2, Send, Sparkles } from 'lucide-react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function Jurimetria() {
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

    // Placeholder de resposta até integrar com backend de jurimetria/IA
    const fakeResponse: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content:
        'Esta é uma resposta de exemplo. Aqui você verá análises jurimétricas, estatísticas de resultados, tempos médios de tramitação e insights baseados nos dados dos seus processos quando a integração estiver concluída.',
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, fakeResponse]);
      setIsSending(false);
    }, 800);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-6 min-h-full flex flex-col">
      <div className="max-w-5xl mx-auto flex flex-col gap-4 w-full flex-1">
        <div className="flex items-center justify-between gap-3 mb-2">
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

        <Card className="flex flex-col flex-1 bg-background/60 backdrop-blur border-border/60">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-semibold text-muted-foreground flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Assistente de Jurimetria
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col flex-1 pt-4 gap-4 min-h-[400px]">
            <ScrollArea className="flex-1 pr-2">
              <div ref={scrollRef} className="flex flex-col gap-4 pb-4 max-h-[60vh] overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn('flex w-full', {
                      'justify-end': message.role === 'user',
                      'justify-start': message.role === 'assistant',
                    })}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm border',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground border-primary/80 rounded-br-sm'
                          : 'bg-muted/70 text-foreground border-border/70 rounded-bl-sm'
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                
              </div>
            </ScrollArea>

            <form
              className="mt-2 flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3 py-2 shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte algo como: Quais as chances de êxito em ações trabalhistas desta organização?"
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
