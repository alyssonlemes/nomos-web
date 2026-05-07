import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Loader2,
  ArrowLeft,
  Plus,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { UserService } from "@/services/user.service";
import {
  MeetingService,
  MeetingConflict,
  MeetingConflictError,
} from "@/services/meeting.service";

type MeetingParticipant = {
  id: number;
  full_name?: string | null;
  email?: string | null;
};

export default function NewMeeting() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<MeetingParticipant[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [conflicts, setConflicts] = useState<MeetingConflict[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresAcceptance, setRequiresAcceptance] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const resp = await UserService.getUsers(0, 500);
        setUsers(resp.users || []);
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  const filteredUsers = users.filter(user => {
    const query = participantSearch.trim().toLowerCase();
    if (!query) return true;

    return [user.full_name, user.email]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(query));
  });

  const selectedUsers = users.filter(user => selected.includes(user.id));

  const handleParticipantToggle = (userId: number) => {
    setSelected(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setConflicts([]);
    setIsLoading(true);
    try {
      if (!title) throw new Error("Título é obrigatório");
      if (!startAt || !endAt) throw new Error("Período inválido");
      if (selected.length === 0)
        throw new Error("Selecione ao menos um participante");

      const payload = {
        title,
        description,
        start_at: startAt,
        end_at: endAt,
        participant_ids: selected,
        organization_id: UserService.getStoredUser()?.organization_id,
        requires_acceptance: requiresAcceptance,
      };

      await MeetingService.createMeeting(payload);
      toast.success("Reunião criada com sucesso");
      setLocation("/meetings");
    } catch (err) {
      if (err && typeof err === "object" && "conflicts" in err) {
        const conflictError = err as MeetingConflictError;
        setConflicts(conflictError.conflicts || []);

        const conflictDetails = conflictError.conflicts
          .map(meeting => {
            const participantsText = (meeting.participants || [])
              .map(
                participant =>
                  participant.full_name ||
                  participant.email ||
                  `ID ${participant.id}`
              )
              .join(", ");

            return `${meeting.title} — ${new Date(meeting.start_at).toLocaleString()} → ${new Date(meeting.end_at).toLocaleString()} (${participantsText})`;
          })
          .join(" | ");

        const msg = conflictError.message || "Conflito de horário detectado";
        setError(msg);
        toast.error(conflictDetails ? `${msg}: ${conflictDetails}` : msg);
      } else {
        const msg =
          err instanceof Error ? err.message : "Erro ao criar reunião";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/meetings")}
            className="mb-4 -ml-4 hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Reuniões
          </Button>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            Nova Reunião
          </h1>
          <p className="text-muted-foreground">
            Agende uma reunião e convide participantes da sua organização
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleCreate}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Detalhes da Reunião</CardTitle>
              <CardDescription>
                Campos principais do agendamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Título <span className="text-destructive">*</span>
                </label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Digite o título da reunião"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Descrição
                </label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descrição (opcional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Início
                  </label>
                  <Input
                    type="datetime-local"
                    value={startAt}
                    onChange={e => setStartAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Fim
                  </label>
                  <Input
                    type="datetime-local"
                    value={endAt}
                    onChange={e => setEndAt(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Participantes
                </label>
                <Popover
                  open={participantsOpen}
                  onOpenChange={setParticipantsOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={participantsOpen}
                      className={cn(
                        "w-full justify-between font-normal hover:bg-muted hover:text-foreground",
                        selected.length === 0 && "text-muted-foreground"
                      )}
                    >
                      {selected.length > 0
                        ? `${selected.length} participante${selected.length > 1 ? "s" : ""} selecionado${selected.length > 1 ? "s" : ""}`
                        : "Selecione participantes"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar por nome ou e-mail"
                        value={participantSearch}
                        onValueChange={setParticipantSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                        <CommandGroup>
                          {filteredUsers.map(user => {
                            const label =
                              user.full_name || user.email || `ID ${user.id}`;
                            const isSelected = selected.includes(user.id);

                            return (
                              <CommandItem
                                key={user.id}
                                value={label}
                                onSelect={() =>
                                  handleParticipantToggle(user.id)
                                }
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span>{label}</span>
                                {user.email && user.full_name ? (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {user.email}
                                  </span>
                                ) : null}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedUsers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedUsers.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleParticipantToggle(user.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-sm text-foreground hover:bg-muted/80"
                        title="Remover participante"
                      >
                        {user.full_name || user.email || `ID ${user.id}`}
                        <span className="text-muted-foreground">×</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={requiresAcceptance}
                      onChange={e => setRequiresAcceptance(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">
                      Solicitar aceite de todos os participantes
                    </span>
                  </label>
                </div>
                <Button type="submit" variant="default" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Criar Reunião
                </Button>
              </div>

              {conflicts.length > 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Foram encontrados conflitos para os participantes
                    selecionados. Ajuste o horário ou troque os usuários
                    ocupados.
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      {conflicts.map(meeting => (
                        <li key={meeting.id}>
                          <div className="font-medium text-foreground">
                            {meeting.title}
                          </div>
                          <div>
                            {new Date(meeting.start_at).toLocaleString()} →{" "}
                            {new Date(meeting.end_at).toLocaleString()}
                          </div>
                          <div>
                            Ocupado:{" "}
                            {(meeting.participants || [])
                              .map(
                                participant =>
                                  participant.full_name ||
                                  participant.email ||
                                  `ID ${participant.id}`
                              )
                              .join(", ")}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
