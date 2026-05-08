import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import {
  ActivityService,
  Activity,
  ActivityKanbanResponse,
} from "@/services/activity.service";
import { UserService } from "@/services/user.service";

interface KanbanColumn {
  id?: number;
  status: string;
  label: string;
  color: string;
  order_index: number;
  is_default: boolean;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  {
    status: "todo",
    label: "A Fazer",
    color: "#f1f5f9",
    order_index: 1,
    is_default: true,
  },
  {
    status: "in_progress",
    label: "Em Andamento",
    color: "#dbeafe",
    order_index: 2,
    is_default: true,
  },
  {
    status: "done",
    label: "Concluído",
    color: "#dcfce7",
    order_index: 3,
    is_default: true,
  },
];

export default function ActivitiesPage() {
  const [, setLocation] = useLocation();
  const [kanbanData, setKanbanData] = useState<Map<string, Activity[]>>(
    new Map()
  );
  const [columns, setColumns] = useState<KanbanColumn[]>(DEFAULT_COLUMNS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [orgId, setOrgId] = useState<number | null>(null);
  const [activityType, setActivityType] = useState<"all" | "task" | "event">(
    "all"
  );
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = UserService.getStoredUser();
    if (!user?.organization_id) {
      setError("Nenhuma organização selecionada");
      return;
    }

    setIsAdmin(
      user.role?.toLowerCase() === "admin" ||
        user.role?.toLowerCase() === "owner"
    );
    setOrgId(user.organization_id);
    loadKanban(user.organization_id);
    loadColumns(user.organization_id);
  }, []);

  const loadKanban = async (organizationId: number) => {
    try {
      setIsLoading(true);
      setError("");
      const data: ActivityKanbanResponse[] =
        await ActivityService.getActivityKanban(organizationId);

      const grouped = new Map<string, Activity[]>();
      data.forEach(group => {
        grouped.set(group.status, group.activities);
      });

      setKanbanData(grouped);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar atividades";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadColumns = async (organizationId: number) => {
    try {
      const customColumns = await ActivityService.listColumns(organizationId);
      if (customColumns && customColumns.length > 0) {
        const mappedColumns: KanbanColumn[] = customColumns.map((col: any) => ({
          id: col.id,
          status: col.status || `custom_${col.id}`,
          label: col.name,
          color: col.color || "#f3f4f6",
          order_index: col.order_index || 0,
          is_default: col.is_default || false,
        }));
        setColumns(mappedColumns);
      } else {
        setColumns(DEFAULT_COLUMNS);
      }
    } catch (err) {
      setColumns(DEFAULT_COLUMNS);
    }
  };

  const handleDelete = async (activityId: number) => {
    if (!confirm("Tem certeza que deseja deletar esta atividade?")) return;
    try {
      await ActivityService.deleteActivity(activityId);
      toast.success("Atividade deletada");
      if (orgId) await loadKanban(orgId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao deletar";
      toast.error(msg);
    }
  };

  const handleDragStart = (activity: Activity) => {
    setDraggedActivity(activity);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnColumn = async (status: string) => {
    if (!draggedActivity) return;

    try {
      await ActivityService.moveActivity(draggedActivity.id, status);
      toast.success("Atividade movida");
      if (orgId) await loadKanban(orgId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao mover atividade";
      toast.error(msg);
    } finally {
      setDraggedActivity(null);
    }
  };

  const filteredKanban = new Map<string, Activity[]>();
  kanbanData.forEach((activities, status) => {
    const filtered = activities.filter(activity => {
      if (activityType === "all") return true;
      return activity.type === activityType;
    });
    filteredKanban.set(status, filtered);
  });

  return (
    <div className="p-8 min-h-full bg-gray-50">
      <div className="max-w-full mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Atividades
            </h1>
            <p className="text-muted-foreground">
              Gerencie tarefas e eventos em um quadro Kanban
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button
                onClick={() => setLocation("/activities/columns-manager")}
                variant="outline"
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Gerenciar Colunas
              </Button>
            )}
            <Button
              onClick={() => setLocation("/activities/novo")}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Atividade
            </Button>
          </div>
        </div>

        <div className="mb-6 flex gap-4">
          <div className="flex gap-2">
            <Button
              variant={activityType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActivityType("all")}
            >
              Todas
            </Button>
            <Button
              variant={activityType === "task" ? "default" : "outline"}
              size="sm"
              onClick={() => setActivityType("task")}
            >
              Tarefas
            </Button>
            <Button
              variant={activityType === "event" ? "default" : "outline"}
              size="sm"
              onClick={() => setActivityType("event")}
            >
              Eventos
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {columns.map(column => {
              const activities = filteredKanban.get(column.status) || [];
              return (
                <div key={column.status} className="flex flex-col">
                  <div
                    className="rounded-t-lg p-4 border border-gray-200 flex items-center justify-between"
                    style={{ backgroundColor: column.color }}
                  >
                    <div>
                      <h2 className="font-semibold text-foreground mb-1">
                        {column.label}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {activities.length} atividade(s)
                      </p>
                    </div>
                  </div>

                  <div
                    className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-4 flex-1 min-h-96 space-y-3 overflow-y-auto"
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropOnColumn(column.status)}
                  >
                    {activities.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma atividade
                      </p>
                    ) : (
                      activities.map(activity => (
                        <ActivityCard
                          key={activity.id}
                          activity={activity}
                          onEdit={() => setLocation(`/activities/${activity.id}`)}
                          onDelete={() => handleDelete(activity.id)}
                          onDragStart={() => handleDragStart(activity)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface ActivityCardProps {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
}

function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onDragStart,
}: ActivityCardProps) {
  const [showActions, setShowActions] = useState(false);

  const typeLabel = activity.type === "task" ? "📋" : "📅";

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className="cursor-move hover:shadow-lg transition-all bg-white border border-gray-200 hover:border-gray-300"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg flex-shrink-0">{typeLabel}</span>
            <h3 className="font-semibold text-sm text-foreground truncate flex-1">
              {activity.title}
            </h3>
          </div>
          {showActions && (
            <div className="flex gap-1 flex-shrink-0 ml-2">
              <button
                onClick={e => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1 hover:bg-blue-50 rounded transition"
              >
                <Edit2 className="w-4 h-4 text-blue-600" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 hover:bg-red-50 rounded transition"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}
        </div>

        {activity.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {activity.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mb-2">
          <span
            className={`text-xs px-2 py-1 rounded font-medium ${
              activity.priority === "low"
                ? "bg-green-100 text-green-900"
                : activity.priority === "medium"
                  ? "bg-yellow-100 text-yellow-900"
                  : activity.priority === "high"
                    ? "bg-orange-100 text-orange-900"
                    : "bg-red-100 text-red-900"
            }`}
          >
            {activity.priority === "low"
              ? "Baixa"
              : activity.priority === "medium"
                ? "Média"
                : activity.priority === "high"
                  ? "Alta"
                  : "Crítica"}
          </span>
          {activity.responsible?.full_name && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-900 rounded font-medium">
              {activity.responsible.full_name}
            </span>
          )}
        </div>

        {activity.end_date && (
          <p className="text-xs text-muted-foreground mb-2">
            Prazo: {new Date(activity.end_date).toLocaleDateString("pt-BR")}
          </p>
        )}

        {(activity.comments?.length || 0) > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <MessageSquare className="w-3 h-3" />
            {activity.comments?.length} comentário(s)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
