import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const [orgId, setOrgId] = useState<number | null>(null);
  const [activityType, setActivityType] = useState<"all" | "task" | "event">(
    "all"
  );
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);
  const [dragOverColumnStatus, setDragOverColumnStatus] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = UserService.getStoredUser();
    if (!user?.organization_id) {
      toast.error("Nenhuma organização selecionada");
      setIsLoading(false);
      return;
    }

    setIsAdmin(
      user.role?.toLowerCase() === "admin" ||
        user.role?.toLowerCase() === "owner"
    );
    setOrgId(user.organization_id);
    loadKanban(user.organization_id, true);
    loadColumns(user.organization_id);
  }, []);

  const loadKanban = async (organizationId: number, showSpinner = true) => {
    try {
      if (showSpinner) {
        setIsLoading(true);
      }
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
      toast.error(msg);
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      }
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
    // Optimistic local deletion
    const previousKanbanData = new Map(
      Array.from(kanbanData.entries()).map(([k, v]) => [k, [...v]])
    );

    setKanbanData(prev => {
      const next = new Map<string, Activity[]>();
      prev.forEach((activities, status) => {
        next.set(
          status,
          activities.filter(a => a.id !== activityId)
        );
      });
      return next;
    });

    try {
      await ActivityService.deleteActivity(activityId);
      toast.success("Atividade deletada");
      if (orgId) await loadKanban(orgId, false);
    } catch (err) {
      setKanbanData(previousKanbanData);
      const msg = err instanceof Error ? err.message : "Erro ao deletar";
      toast.error(msg);
    }
  };

  const handleDragStart = (e: React.DragEvent, activity: Activity) => {
    setDraggedActivity(activity);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", activity.id.toString());
  };

  const handleDragEnd = () => {
    setDraggedActivity(null);
    setDragOverColumnStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumnStatus !== status) {
      setDragOverColumnStatus(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent, status: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumnStatus === status) {
      setDragOverColumnStatus(null);
    }
  };

  const handleDropOnColumn = async (targetStatus: string) => {
    setDragOverColumnStatus(null);
    if (!draggedActivity) return;

    const sourceStatus = draggedActivity.status;
    const activityToMove = { ...draggedActivity, status: targetStatus };
    setDraggedActivity(null);

    if (sourceStatus === targetStatus) return;

    // Snapshot current state for rollback if network fails
    const previousKanbanData = new Map(
      Array.from(kanbanData.entries()).map(([k, v]) => [k, [...v]])
    );

    // Optimistic UI update
    setKanbanData(prev => {
      const next = new Map<string, Activity[]>();
      prev.forEach((activities, status) => {
        if (status === sourceStatus) {
          next.set(
            status,
            activities.filter(a => a.id !== activityToMove.id)
          );
        } else if (status === targetStatus) {
          next.set(status, [...activities, activityToMove]);
        } else {
          next.set(status, [...activities]);
        }
      });
      if (!next.has(targetStatus)) {
        next.set(targetStatus, [activityToMove]);
      }
      return next;
    });

    try {
      await ActivityService.moveActivity(activityToMove.id, targetStatus);
      toast.success("Atividade movida");
      // Refresh silently in background to keep data in sync
      if (orgId) await loadKanban(orgId, false);
    } catch (err) {
      // Rollback on error
      setKanbanData(previousKanbanData);
      const msg = err instanceof Error ? err.message : "Erro ao mover atividade";
      toast.error(msg);
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


        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {columns.map(column => {
              const activities = filteredKanban.get(column.status) || [];
              const isDragOver = dragOverColumnStatus === column.status;

              return (
                <div key={column.status} className="flex flex-col">
                  <div
                    className="rounded-t-lg p-4 border border-gray-200 flex items-center justify-between transition-colors"
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
                    className={`bg-white border border-t-0 border-gray-200 rounded-b-lg p-4 flex-1 min-h-96 space-y-3 overflow-y-auto transition-all duration-200 ${
                      isDragOver
                        ? "bg-gray-50/60"
                        : ""
                    }`}
                    onDragOver={e => handleDragOver(e, column.status)}
                    onDragLeave={e => handleDragLeave(e, column.status)}
                    onDrop={e => {
                      e.preventDefault();
                      handleDropOnColumn(column.status);
                    }}
                  >
                    <AnimatePresence mode="popLayout">
                      {activities.length === 0 ? (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg text-muted-foreground text-sm"
                        >
                          Nenhuma atividade
                        </motion.div>
                      ) : (
                        activities.map(activity => (
                          <motion.div
                            key={activity.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          >
                            <ActivityCard
                              activity={activity}
                              isDragging={draggedActivity?.id === activity.id}
                              onEdit={() => setLocation(`/activities/${activity.id}`)}
                              onDelete={() => handleDelete(activity.id)}
                              onDragStart={e => handleDragStart(e, activity)}
                              onDragEnd={handleDragEnd}
                            />
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
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
  isDragging?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function ActivityCard({
  activity,
  isDragging,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
}: ActivityCardProps) {
  const [showActions, setShowActions] = useState(false);

  const typeLabel = activity.type === "task" ? "📋" : "📅";

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`cursor-grab active:cursor-grabbing transition-all duration-150 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md select-none ${
        isDragging ? "opacity-40" : ""
      }`}
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
              <ConfirmDialog
                title="Deletar atividade"
                description="Tem certeza que deseja deletar esta atividade?"
                onConfirm={() => onDelete()}
                trigger={
                  <button
                    onClick={e => e.stopPropagation()}
                    className="p-1 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                }
              />
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

