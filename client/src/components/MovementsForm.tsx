import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2, HistoryIcon, Check, X } from 'lucide-react';
import { ProcessoMovimentoCreate } from '@/services/legal-action.service';

interface MovementsFormProps {
  movements: ProcessoMovimentoCreate[];
  onChange: (movements: ProcessoMovimentoCreate[]) => void;
  disabled?: boolean;
}

export function MovementsForm({ movements, onChange, disabled }: MovementsFormProps) {
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDataHora, setNewDataHora] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleSave = () => {
    if (!newName.trim()) return;
    
    let dataHoraIso = new Date().toISOString();
    if (newDataHora) {
      try {
        dataHoraIso = new Date(newDataHora).toISOString();
      } catch (e) {
        // use default
      }
    }

    if (editingIndex !== null) {
      const next = [...movements];
      next[editingIndex] = {
        ...next[editingIndex],
        nome: newName.trim(),
        codigo: newCode.trim() || undefined,
        data_hora: dataHoraIso,
      };
      onChange(next);
      handleCancelEdit();
    } else {
      const newMov: ProcessoMovimentoCreate = {
        nome: newName.trim(),
        codigo: newCode.trim() || undefined,
        data_hora: dataHoraIso,
      };
      onChange([...movements, newMov]);
      setNewName('');
      setNewCode('');
      setNewDataHora('');
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setNewName(movements[index].nome);
    setNewCode(movements[index].codigo || '');
    
    let dt = '';
    if (movements[index].data_hora) {
      try {
        const date = new Date(movements[index].data_hora as string);
        if (!isNaN(date.getTime())) {
          dt = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }
      } catch (e) {}
    }
    setNewDataHora(dt);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewName('');
    setNewCode('');
    setNewDataHora('');
  };

  const handleRemove = (index: number) => {
    const next = [...movements];
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
      {movements.length > 0 ? (
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 text-xs">
          {movements.map((mov, i) => (
            <div key={i} className={`flex items-start justify-between gap-3 p-2.5 rounded border ${editingIndex === i ? 'bg-primary/5 border-primary/30' : 'bg-muted/40 border-border/50'}`}>
              <div className="flex-1">
                <p className="font-medium text-foreground">{mov.nome}</p>
                {mov.codigo && <span className="text-[11px] text-muted-foreground">Código TPU: {mov.codigo}</span>}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground shrink-0 font-mono text-[11px] mr-2">
                  {mov.data_hora ? new Date(mov.data_hora).toLocaleString('pt-BR') : '—'}
                </span>
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
          Nenhum movimento registrado.
        </div>
      )}

      {!disabled && (
        <div className="flex flex-wrap gap-2 items-end mt-4 bg-muted/20 p-3 rounded-md border border-border/50">
          <div className="flex-1 min-w-[200px] space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Nome / Descrição</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex.: Conclusão"
              className="h-8 text-xs bg-background"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
          <div className="w-24 space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Código TPU</label>
            <Input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Ex.: 51"
              className="h-8 text-xs bg-background"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
          <div className="w-40 space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Data e Hora</label>
            <Input
              type="datetime-local"
              value={newDataHora}
              onChange={(e) => setNewDataHora(e.target.value)}
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
