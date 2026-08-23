import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2, Check, X, Tag } from 'lucide-react';

export interface AssuntoItem {
  codigo?: string | null;
  nome: string;
}

interface AssuntosFormProps {
  assuntos: AssuntoItem[];
  onChange: (assuntos: AssuntoItem[]) => void;
  disabled?: boolean;
}

export function AssuntosForm({ assuntos, onChange, disabled }: AssuntosFormProps) {
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleSave = () => {
    if (!newName.trim()) return;

    if (editingIndex !== null) {
      const next = [...assuntos];
      next[editingIndex] = {
        ...next[editingIndex],
        nome: newName.trim(),
        codigo: newCode.trim() || undefined,
      };
      onChange(next);
      handleCancelEdit();
    } else {
      const newAssunto: AssuntoItem = {
        nome: newName.trim(),
        codigo: newCode.trim() || undefined,
      };
      onChange([...assuntos, newAssunto]);
      setNewName('');
      setNewCode('');
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setNewName(assuntos[index].nome);
    setNewCode(assuntos[index].codigo || '');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewName('');
    setNewCode('');
  };

  const handleRemove = (index: number) => {
    const next = [...assuntos];
    next.splice(index, 1);
    onChange(next);
    if (editingIndex === index) {
      handleCancelEdit();
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  return (
    <div className="space-y-4">
      {assuntos.length > 0 ? (
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 text-xs">
          {assuntos.map((assunto, i) => (
            <div key={i} className={`flex items-start justify-between gap-3 p-2.5 rounded border ${editingIndex === i ? 'bg-primary/5 border-primary/30' : 'bg-muted/40 border-border/50'}`}>
              <div className="flex-1 flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{assunto.nome}</p>
                  {assunto.codigo && <span className="text-[11px] text-muted-foreground">Código TPU: {assunto.codigo}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!disabled && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => handleEdit(i)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground py-4 text-center border border-dashed rounded-md bg-muted/20">
          Nenhum assunto registrado.
        </div>
      )}

      {!disabled && (
        <div className="flex flex-wrap gap-2 items-end mt-4 bg-muted/20 p-3 rounded-md border border-border/50">
          <div className="flex-1 min-w-[200px] space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Nome do Assunto</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex.: Indenização por Dano Moral"
              className="h-8 text-xs bg-background"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
          <div className="w-32 space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Código TPU</label>
            <Input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Ex.: 10433"
              className="h-8 text-xs bg-background"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
          {editingIndex !== null ? (
            <div className="flex gap-1">
              <Button
                type="button"
                onClick={handleSave}
                disabled={!newName.trim()}
                size="sm"
                className="h-8 shrink-0 bg-primary text-primary-foreground"
              >
                <Check className="h-4 w-4 mr-1" />
                Salvar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                size="sm"
                className="h-8 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleSave}
              disabled={!newName.trim()}
              size="sm"
              className="h-8 shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
