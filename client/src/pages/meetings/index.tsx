import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { MeetingService } from "@/services/meeting.service";
import { UserService } from "@/services/user.service";

interface MeetingItem {
  id: number;
  title: string;
  description?: string | null;
  start_at: string;
  end_at: string;
  status?: string;
  requires_acceptance?: boolean;
  participants?: Array<{
    id: number;
    full_name?: string | null;
    email?: string | null;
  }>;
  participant_ids?: number[];
}

export default function MeetingsPage() {
  const [, setLocation] = useLocation();
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      setError("");
      const user = UserService.getStoredUser();
      if (!user) {
        setMeetings([]);
        setTotal(0);
        return;
      }

      const data = await MeetingService.listForUser(user.id);
      const items = Array.isArray(data?.meetings) ? data.meetings : [];
      setMeetings(items);
      setTotal(typeof data?.total === "number" ? data.total : items.length);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar reuniões"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (meetingId: number) => {
    try {
      await MeetingService.acceptMeeting(meetingId);
      toast.success("Presença confirmada");
      await loadMeetings();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao confirmar presença";
      toast.error(msg);
    }
  };

  const handleDecline = async (meetingId: number) => {
    const reason = window.prompt("Informe o motivo da recusa:");
    if (reason === null) return;

    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      toast.error("O motivo da recusa é obrigatório");
      return;
    }

    try {
      const result = await MeetingService.declineMeeting(
        meetingId,
        normalizedReason
      );
      const declinedBy = result?.declined_by
        ? ` (usuário ${result.declined_by})`
        : "";
      toast.error(`Reunião cancelada por recusa${declinedBy}`);
      await loadMeetings();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao recusar presença";
      toast.error(msg);
    }
  };

  const columns: Column<MeetingItem>[] = [
    {
      header: "Título",
      accessorKey: "title",
      className: "font-medium text-foreground",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: meeting => meeting.status || "",
    },
    {
      header: "Início",
      cell: meeting => new Date(meeting.start_at).toLocaleString("pt-BR"),
    },
    {
      header: "Fim",
      cell: meeting => new Date(meeting.end_at).toLocaleString("pt-BR"),
    },
    {
      header: "Participantes",
      cell: meeting =>
        String(
          meeting.participants?.length || meeting.participant_ids?.length || 0
        ),
    },
    {
      header: "Ações",
      cell: meeting => {
        const canRespond =
          Boolean(meeting.requires_acceptance) &&
          meeting.status === "pending_confirmation";

        if (!canRespond) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleAccept(meeting.id)}
            >
              Aceitar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDecline(meeting.id)}
            >
              Recusar
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Reuniões
            </h1>
            <p className="text-muted-foreground">
              Gerencie os agendamentos da sua organização
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => setLocation("/meetings/novo")}
          >
            <Plus className="w-4 h-4" />
            Nova Reunião
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lista de Reuniões</CardTitle>
            <CardDescription>
              Total de {total} reunião{total !== 1 ? "s" : ""} cadastrada
              {total !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Nenhuma reunião encontrada
                </p>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/meetings/novo")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Reunião
                </Button>
              </div>
            ) : (
              <DataTable columns={columns} data={meetings} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
