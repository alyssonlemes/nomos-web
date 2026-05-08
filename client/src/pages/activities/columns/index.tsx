import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  GripVertical,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

import { ActivityService } from "@/services/activity.service";
import { UserService } from "@/services/user.service";

import ColumnsNew from "./new";
import ColumnsEdit, { ColumnData as ColumnDataForEdit } from "./edit";

interface ColumnData {
  id?: number;
  name: string;
  status?: string;
  color: string;
  order_index: number;
  is_default: boolean;
}

export default function ColumnsManagerPage() {
  const [, setLocation] = useLocation();
  const [columns, setColumns] = useState<ColumnData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [orgId, setOrgId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnData | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<ColumnData | null>(null);

  useEffect(() => {
    const user = UserService.getStoredUser();
    if (!user?.organization_id) {
      setError("Nenhuma organização selecionada");
      return;
    }

    setOrgId(user.organization_id);
    loadColumns(user.organization_id);
  }, []);

  const loadColumns = async (organizationId: number) => {
    try {
      setIsLoading(true);
      setError("");
      const data = await ActivityService.listColumns(organizationId);
      const sorted = (data || []).sort(
        (a: ColumnData, b: ColumnData) =>
          (a.order_index || 0) - (b.order_index || 0)
      );
      setColumns(sorted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar colunas";
      setError(msg);
      toast.error(msg);
      setColumns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddColumn = () => {
    setEditingColumn(null);
    setShowNew(true);
  };

  const handleEditColumn = (column: ColumnData) => {
    setShowNew(false);
    setEditingColumn(column);
  };

  const handleDeleteColumn = async (
    columnId: number | undefined,
    isDefault: boolean
  ) => {
    if (isDefault) {
      toast.error("Não é possível deletar colunas padrão");
      return;
    }
    if (!columnId) return;
    if (!confirm("Tem certeza que deseja deletar esta coluna?")) return;

    try {
      await ActivityService.deleteColumn(columnId);
      toast.success("Coluna deletada");
      if (orgId) await loadColumns(orgId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao deletar coluna";
      toast.error(msg);
    }
  };

  const handleDragStart = (column: ColumnData) => {
    setDraggedColumn(column);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetColumn: ColumnData) => {
    if (!draggedColumn || draggedColumn.id === targetColumn.id) {
      setDraggedColumn(null);
      return;
    }

    try {
      const newColumns = [...columns];
      const draggedIndex = newColumns.findIndex(c => c.id === draggedColumn.id);
      const targetIndex = newColumns.findIndex(c => c.id === targetColumn.id);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removed] = newColumns.splice(draggedIndex, 1);
        newColumns.splice(targetIndex, 0, removed);

        const updated = newColumns.map((col, idx) => ({
          ...col,
          order_index: idx + 1,
        }));
        setColumns(updated);

        if (orgId && draggedColumn.id) {
          await ActivityService.updateColumn(
            draggedColumn.id,
            orgId,
            draggedColumn.name,
            targetIndex + 1,
            draggedColumn.color,
            draggedColumn.status,
            draggedColumn.is_default
          );
        }
        toast.success("Ordem atualizada");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao reordenar";
      toast.error(msg);
      if (orgId) await loadColumns(orgId);
    } finally {
      setDraggedColumn(null);
    }
  };

  return (
    <div className="p-8 min-h-full bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/activities")}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Gerenciar Colunas
              </h1>
              <p className="text-muted-foreground">
                Organize suas colunas do Kanban
              </p>
            </div>
          </div>
          <Button onClick={handleAddColumn} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Coluna
          </Button>
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
          <div className="space-y-3">
            {columns.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nenhuma coluna criada
                </CardContent>
              </Card>
            ) : (
              columns.map(column => (
                <Card
                  key={column.id}
                  draggable={!column.is_default}
                  onDragStart={() => handleDragStart(column)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column)}
                  className={`${!column.is_default ? "cursor-move hover:shadow-md" : ""} transition-shadow`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {!column.is_default && (
                        <div className="flex-shrink-0 text-gray-400">
                          <GripVertical className="w-5 h-5" />
                        </div>
                      )}

                      <div
                        className="w-6 h-6 rounded border-2 border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: column.color }}
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {column.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {column.status && `Status: ${column.status}`} {" "}
                          {column.is_default && "(Padrão)"}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditColumn(column)}
                          className="p-2 hover:bg-blue-50 rounded transition"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        {!column.is_default && (
                          <button
                            onClick={() =>
                              handleDeleteColumn(column.id, column.is_default)
                            }
                            className="p-2 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {orgId && showNew && (
          <ColumnsNew
            orgId={orgId}
            nextOrderIndex={columns.length + 1}
            onClose={() => setShowNew(false)}
            onSaved={() => loadColumns(orgId)}
          />
        )}

        {orgId && editingColumn && (
          <ColumnsEdit
            orgId={orgId}
            column={editingColumn as ColumnDataForEdit}
            position={
              Math.max(
                1,
                columns.findIndex(c => c.id === editingColumn.id) + 1
              )
            }
            onClose={() => setEditingColumn(null)}
            onSaved={() => loadColumns(orgId)}
          />
        )}
      </div>
    </div>
  );
}
