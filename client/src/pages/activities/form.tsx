import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select-field";
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

import { ActivityService, Activity } from "@/services/activity.service";
import { UserService } from "@/services/user.service";

interface FormData {
  title: string;
  description: string;
  type: "task" | "event";
  responsible_id: number | null;
  priority: "low" | "medium" | "high" | "critical";
  status: string;
  start_date: string;
  end_date: string;
  event_time: string;
  location_or_link: string;
  estimated_hours: number | null;
  observations: string;
  participant_ids: number[];
}

interface ActivityUserOption {
  id: number;
  full_name?: string | null;
  email?: string | null;
}

interface ActivityColumnOption {
  value: string;
  label: string;
}

export default function ActivityFormPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    type: "task",
    responsible_id: null,
    priority: "medium",
    status: "",
    start_date: "",
    end_date: "",
    event_time: "",
    location_or_link: "",
    estimated_hours: null,
    observations: "",
    participant_ids: [],
  });

  const [users, setUsers] = useState<ActivityUserOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<ActivityColumnOption[]>(
    []
  );
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsersAndColumns = async () => {
      try {
        const user = UserService.getStoredUser();
        if (!user?.organization_id) {
          setError("Organização não encontrada");
          return;
        }

        const resp = await UserService.getUsers(0, 500);
        setUsers(resp.users || []);

        const cols = await ActivityService.listColumns(user.organization_id);
        const options: ActivityColumnOption[] = (cols || [])
          .filter((col: any) => !!col.status)
          .map((col: any) => ({ value: col.status, label: col.name }));

        setStatusOptions(options);

        if (options.length > 0) {
          setFormData(prev => {
            const hasCurrent = options.some(opt => opt.value === prev.status);
            return hasCurrent ? prev : { ...prev, status: options[0].value };
          });
        }
      } catch (err) {
        setStatusOptions([]);
      }
    };

    loadUsersAndColumns();

    if (isEditing && id) {
      loadActivity(parseInt(id));
    }
  }, [isEditing, id]);

  const filteredUsers = users.filter(user => {
    const query = participantSearch.trim().toLowerCase();
    if (!query) return true;

    return [user.full_name, user.email]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(query));
  });

  const selectedUsers = users.filter(user =>
    formData.participant_ids.includes(user.id)
  );

  const handleParticipantToggle = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      participant_ids: prev.participant_ids.includes(userId)
        ? prev.participant_ids.filter(id => id !== userId)
        : [...prev.participant_ids, userId],
    }));
  };

  const loadActivity = async (activityId: number) => {
    try {
      setIsLoading(true);
      const activity: Activity = await ActivityService.getActivity(activityId);
      setFormData({
        title: activity.title || "",
        description: activity.description || "",
        type: (activity.type as "task" | "event") || "task",
        responsible_id: activity.responsible_id || null,
        priority: (activity.priority as any) || "medium",
        status: (activity.status as any) || "",
        start_date: activity.start_date || "",
        end_date: activity.end_date || "",
        event_time: activity.event_time || "",
        location_or_link: activity.location_or_link || "",
        estimated_hours: activity.estimated_hours || null,
        observations: activity.observations || "",
        participant_ids: activity.participants?.map(p => p.id) || [],
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar atividade";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      if (!formData.title) throw new Error("Título é obrigatório");
      if (!formData.start_date || !formData.end_date)
        throw new Error("Datas são obrigatórias");
      if (!formData.status) throw new Error("Selecione um status válido");

      const user = UserService.getStoredUser();
      if (!user?.organization_id) throw new Error("Organização não encontrada");

      const payload = {
        ...formData,
        organization_id: user.organization_id,
        participant_ids: formData.participant_ids,
      };

      if (isEditing && id) {
        await ActivityService.updateActivity(parseInt(id), payload);
        toast.success("Atividade atualizada");
      } else {
        await ActivityService.createActivity(payload);
        toast.success("Atividade criada");
      }

      setLocation("/activities");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/activities")}
            className="mb-4 -ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isEditing ? "Editar Atividade" : "Nova Atividade"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Atualize os detalhes" : "Crie uma tarefa ou evento"}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Detalhes da Atividade</CardTitle>
              <CardDescription>Informações básicas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="task"
                      checked={formData.type === "task"}
                      onChange={e => setFormData({ ...formData, type: "task" })}
                    />
                    <span>Tarefa</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="event"
                      checked={formData.type === "event"}
                      onChange={e =>
                        setFormData({ ...formData, type: "event" })
                      }
                    />
                    <span>Evento</span>
                  </label>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Título <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={e =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Digite o título"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Descrição
                </label>
                <Textarea
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descrição detalhada"
                  rows={4}
                />
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  id="priority"
                  label="Prioridade"
                  value={formData.priority}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as
                        | "low"
                        | "medium"
                        | "high"
                        | "critical",
                    })
                  }
                  options={[
                    { value: "low", label: "Baixa" },
                    { value: "medium", label: "Média" },
                    { value: "high", label: "Alta" },
                    { value: "critical", label: "Crítica" },
                  ]}
                />
                <SelectField
                  id="status"
                  label="Status"
                  value={formData.status}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      status: e.target.value,
                    })
                  }
                  options={statusOptions}
                  placeholder="Selecione uma coluna"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Data de Início <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={e =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Data Final <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={e =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Responsible */}
              <SelectField
                id="responsible_id"
                label="Responsável"
                value={
                  formData.responsible_id ? String(formData.responsible_id) : ""
                }
                onChange={e =>
                  setFormData({
                    ...formData,
                    responsible_id:
                      e.target.value && e.target.value !== "__none__"
                        ? parseInt(e.target.value)
                        : null,
                  })
                }
                options={[
                  { value: "__none__", label: "Sem responsável" },
                  ...users.map(user => ({
                    value: String(user.id),
                    label: user.full_name || user.email || `ID ${user.id}`,
                  })),
                ]}
              />

              {/* Participants (Multiple) */}
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
                        formData.participant_ids.length === 0 &&
                          "text-muted-foreground"
                      )}
                    >
                      {formData.participant_ids.length > 0
                        ? `${formData.participant_ids.length} participante${formData.participant_ids.length > 1 ? "s" : ""} selecionado${formData.participant_ids.length > 1 ? "s" : ""}`
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
                            const isSelected =
                              formData.participant_ids.includes(user.id);

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
                        <span className="text-muted-foreground">x</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Event-specific fields */}
              {formData.type === "event" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Horário do Evento
                      </label>
                      <Input
                        type="time"
                        value={formData.event_time}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            event_time: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Local / Link
                      </label>
                      <Input
                        value={formData.location_or_link}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            location_or_link: e.target.value,
                          })
                        }
                        placeholder="Sala 1 ou https://zoom.us/..."
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Task-specific fields */}
              {formData.type === "task" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Horas Estimadas
                  </label>
                  <Input
                    type="number"
                    value={formData.estimated_hours || ""}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        estimated_hours: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Ex: 8"
                  />
                </div>
              )}

              {/* Observations */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Observações
                </label>
                <Textarea
                  value={formData.observations}
                  onChange={e =>
                    setFormData({ ...formData, observations: e.target.value })
                  }
                  placeholder="Notas adicionais"
                  rows={3}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {isEditing ? "Atualizar" : "Criar"} Atividade
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/activities")}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
