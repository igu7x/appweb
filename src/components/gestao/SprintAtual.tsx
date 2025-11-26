import { useState, useMemo, useEffect } from 'react';
import { useGestao } from '@/contexts/GestaoContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectorate } from '@/contexts/DirectorateContext';
import { KanbanBoard } from './KanbanBoard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/services/api';
import { BoardStatus, Initiative, InitiativeLocation, ExecutionControl } from '@/types';
import { DropResult } from 'react-beautiful-dnd';
import { SprintStatsCards } from './SprintStatsCards';

export function SprintAtual() {
  const { keyResults, initiatives, refreshData } = useGestao();
  const { user } = useAuth();
  const { selectedDirectorate } = useDirectorate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<BoardStatus>('A_FAZER');
  const [executionData, setExecutionData] = useState<ExecutionControl[]>([]);

  const canEdit = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  useEffect(() => {
    loadExecutionData();
  }, []);

  const loadExecutionData = async () => {
    try {
      const data = await api.getExecutionControls();
      setExecutionData(data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // Filtrar por diretoria
  const filteredInitiatives = useMemo(() => 
    initiatives.filter(init => init.directorate === selectedDirectorate),
    [initiatives, selectedDirectorate]
  );

  const filteredKeyResults = useMemo(() => 
    keyResults.filter(kr => kr.directorate === selectedDirectorate),
    [keyResults, selectedDirectorate]
  );

  const filteredExecutionData = useMemo(() => 
    executionData.filter(item => item.directorate === selectedDirectorate),
    [executionData, selectedDirectorate]
  );

  const sprintInitiatives = useMemo(() => 
    filteredInitiatives.filter(init => init.location === 'SPRINT_ATUAL'),
    [filteredInitiatives]
  );

  // Colunas do Kanban
  const kanbanColumns = useMemo(() => [
    {
      id: 'A_FAZER' as BoardStatus,
      title: 'A Fazer',
      items: sprintInitiatives
        .filter(i => i.boardStatus === 'A_FAZER')
        .map(i => {
          const kr = filteredKeyResults.find(k => k.id === i.keyResultId);
          return {
            id: i.id,
            title: i.title,
            description: i.description,
            badge: kr?.code
          };
        })
    },
    {
      id: 'FAZENDO' as BoardStatus,
      title: 'Fazendo',
      items: sprintInitiatives
        .filter(i => i.boardStatus === 'FAZENDO')
        .map(i => {
          const kr = filteredKeyResults.find(k => k.id === i.keyResultId);
          return {
            id: i.id,
            title: i.title,
            description: i.description,
            badge: kr?.code
          };
        })
    },
    {
      id: 'FEITO' as BoardStatus,
      title: 'Feito',
      items: sprintInitiatives
        .filter(i => i.boardStatus === 'FEITO')
        .map(i => {
          const kr = filteredKeyResults.find(k => k.id === i.keyResultId);
          return {
            id: i.id,
            title: i.title,
            description: i.description,
            badge: kr?.code
          };
        })
    }
  ], [sprintInitiatives, filteredKeyResults]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !canEdit) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as BoardStatus;

    try {
      await api.updateInitiative(draggableId, { boardStatus: newStatus });
      await refreshData();
      await loadExecutionData();
    } catch (error) {
      console.error('Erro ao atualizar iniciativa:', error);
    }
  };

  const handleSaveInitiative = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      keyResultId: formData.get('keyResultId') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      boardStatus: (formData.get('boardStatus') || selectedColumn) as BoardStatus,
      location: 'SPRINT_ATUAL' as InitiativeLocation,
      directorate: selectedDirectorate
    };

    try {
      if (editingInitiative) {
        await api.updateInitiative(editingInitiative.id, data);
      } else {
        await api.createInitiative(data);
      }
      await refreshData();
      await loadExecutionData();
      setDialogOpen(false);
      setEditingInitiative(null);
    } catch (error) {
      console.error('Erro ao salvar iniciativa:', error);
    }
  };

  const handleDeleteInitiative = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta iniciativa?')) {
      try {
        await api.deleteInitiative(id);
        await refreshData();
        await loadExecutionData();
      } catch (error) {
        console.error('Erro ao excluir iniciativa:', error);
      }
    }
  };

  const handleAddInitiative = (columnId: BoardStatus) => {
    setSelectedColumn(columnId);
    setEditingInitiative(null);
    setDialogOpen(true);
  };

  const handleEditInitiative = (id: string) => {
    const initiative = filteredInitiatives.find(i => i.id === id);
    if (initiative) {
      setEditingInitiative(initiative);
      setDialogOpen(true);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Bolachinhas - Cards de Estatísticas */}
      <SprintStatsCards executionData={filteredExecutionData} />

      {/* Kanban Board - Agora ocupa toda a largura */}
      <KanbanBoard
        title="SPRINT ATUAL"
        columns={kanbanColumns}
        onDragEnd={handleDragEnd}
        onAdd={canEdit ? handleAddInitiative : undefined}
        onEdit={canEdit ? handleEditInitiative : undefined}
        onDelete={canEdit ? handleDeleteInitiative : undefined}
        canEdit={canEdit}
      />

      {/* Dialog para Iniciativa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSaveInitiative}>
            <DialogHeader>
              <DialogTitle>{editingInitiative ? 'Editar Iniciativa' : 'Nova Iniciativa'}</DialogTitle>
              <DialogDescription>
                Preencha os dados da iniciativa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="keyResultId">KR Associado</Label>
                <Select name="keyResultId" defaultValue={editingInitiative?.keyResultId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um KR" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredKeyResults.map(kr => (
                      <SelectItem key={kr.id} value={kr.id}>{kr.code} - {kr.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" defaultValue={editingInitiative?.title} required />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" name="description" defaultValue={editingInitiative?.description} />
              </div>
              <div>
                <Label htmlFor="boardStatus">Status</Label>
                <Select name="boardStatus" defaultValue={editingInitiative?.boardStatus || selectedColumn} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A_FAZER">A Fazer</SelectItem>
                    <SelectItem value="FAZENDO">Fazendo</SelectItem>
                    <SelectItem value="FEITO">Feito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}