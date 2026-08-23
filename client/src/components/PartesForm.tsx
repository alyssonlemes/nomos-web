import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2, Check, X, Users } from 'lucide-react';
import { ProcessoParteCreate } from '@/services/legal-action.service';

interface PartesFormProps {
  partes: ProcessoParteCreate[];
  onChange: (partes: ProcessoParteCreate[]) => void;
  disabled?: boolean;
}

export function PartesForm({ partes, onChange, disabled }: PartesFormProps) {
  const [newNome, setNewNome] = useState('');
  const [newPolo, setNewPolo] = useState('');
  const [newTipo, setNewTipo] = useState('');
  const [newDocumento, setNewDocumento] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleSave = () => {
    if (!newNome.trim()) return;

    if (editingIndex !== null) {
      const next = [...partes];
      next[editingIndex] = {
        ...next[editingIndex],
        nome: newNome.trim(),
        polo: newPolo.trim() || undefined,
        tipo_participacao: newTipo.trim() || undefined,
        documento: newDocumento.trim() || undefined,
      };
      onChange(next);
      handleCancelEdit();
    } else {
      const novaParte: ProcessoParteCreate = {
        nome: newNome.trim(),
        polo: newPolo.trim() || undefined,
        tipo_participacao: newTipo.trim() || undefined,
        documento: newDocumento.trim() || undefined,
      };
      onChange([...partes, novaParte]);
      setNewNome('');
      setNewPolo('');
      setNewTipo('');
      setNewDocumento('');
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setNewNome(partes[index].nome);
    setNewPolo(partes[index].polo || '');
    setNewTipo(partes[index].tipo_participacao || '');
    setNewDocumento(partes[index].documento || '');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewNome('');
    setNewPolo('');
    setNewTipo('');
    setNewDocumento('');
  };

  const handleRemove = (index: number) => {
    const next = [...partes];
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
      {partes.length > 0 ? (
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 text-xs">
          {partes.map((parte, i) => (
            <div key={i} className={`flex items-start justify-between gap-3 p-2.5 rounded border ${editingIndex === i ? 'bg-primary/5 border-primary/30' : 'bg-muted/40 border-border/50'}`}>
              <div className="flex-1 flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{parte.nome}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                    {parte.polo && <span><strong className="font-medium text-foreground/70">Polo:</strong> {parte.polo}</span>}
                    {parte.tipo_participacao && <span><strong className="font-medium text-foreground/70">Tipo:</strong> {parte.tipo_participacao}</span>}
                    {parte.documento && <span><strong className="font-medium text-foreground/70">Doc:</strong> {parte.documento}</span>}
                  </div>
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
          Nenhuma parte registrada.
        </div>
      )}

      {!disabled && (
        <div className="flex flex-wrap gap-2 items-end mt-4 bg-muted/20 p-3 rounded-md border border-border/50">
          <div className="flex-1 min-w-[200px] space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Nome da Parte</label>
            <Input
              value={newNome}
              onChange={(e) => setNewNome(e.target.value)}
              placeholder="Ex.: João da Silva"
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
            <label className="text-[11px] font-medium text-muted-foreground">Polo</label>
            <Input
              value={newPolo}
              onChange={(e) => setNewPolo(e.target.value)}
              placeholder="Ex.: ATIVO"
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
            <label className="text-[11px] font-medium text-muted-foreground">Tipo Partic.</label>
            <Input
              value={newTipo}
              onChange={(e) => setNewTipo(e.target.value)}
              placeholder="Ex.: Autor"
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
            <label className="text-[11px] font-medium text-muted-foreground">Documento</label>
            <Input
              value={newDocumento}
              onChange={(e) => setNewDocumento(e.target.value)}
              placeholder="CPF/CNPJ"
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
            <div className="flex gap-1 w-full justify-end mt-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={!newNome.trim()}
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
            <div className="flex gap-1 w-full justify-end mt-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={!newNome.trim()}
                size="sm"
                className="h-8 shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Parte
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
