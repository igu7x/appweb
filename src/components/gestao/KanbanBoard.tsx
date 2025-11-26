import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { BoardStatus } from '@/types';

interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  badge?: string;
}

interface KanbanBoardProps {
  title?: string;
  columns: {
    id: BoardStatus;
    title: string;
    items: KanbanItem[];
  }[];
  onDragEnd: (result: DropResult) => void;
  onAdd?: (columnId: BoardStatus) => void;
  onEdit?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  canEdit?: boolean;
}

// Cores para cada coluna conforme especificação
const columnColors = {
  A_FAZER: 'bg-gray-300', // Cinza para A Fazer
  FAZENDO: 'bg-yellow-200', // Amarelo para Fazendo
  FEITO: 'bg-green-200' // Verde para Feito
};

const columnHeaderColors = {
  A_FAZER: 'bg-gray-400 text-gray-900',
  FAZENDO: 'bg-yellow-400 text-gray-900',
  FEITO: 'bg-green-400 text-gray-900'
};

interface KanbanCardProps {
  item: KanbanItem;
  canEdit: boolean;
  onEdit?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  provided: any;
  snapshot: any;
}

function KanbanCard({ item, canEdit, onEdit, onDelete, provided, snapshot }: KanbanCardProps) {
  const [showDescription, setShowDescription] = useState(false);

  return (
    <Card
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-white ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : 'shadow-sm'
        }`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Badge */}
          {item.badge && (
            <Badge variant="outline" className="shrink-0 text-xs font-semibold border-[#2d6a7f] text-[#2d6a7f]">
              {item.badge}
            </Badge>
          )}

          {/* Title */}
          <span className="flex-1 text-sm font-medium text-gray-700 truncate" title={item.title}>
            {item.title}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Search / Toggle Description */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDescription(!showDescription)}
              className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
              title={showDescription ? "Ocultar descrição" : "Ver descrição"}
            >
              <Search className="h-3.5 w-3.5" />
            </Button>

            {canEdit && (
              <>
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(item.id)}
                    className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(item.id)}
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {showDescription && item.description && (
          <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600 animate-in fade-in slide-in-from-top-1">
            {item.description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KanbanBoard({ title, columns, onDragEnd, onAdd, onEdit, onDelete, canEdit = false }: KanbanBoardProps) {
  return (
    <Card>
      {title && (
        <CardHeader className="bg-[#2d6a7f] text-white">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {columns.map((column) => (
              <div key={column.id} className="space-y-2">
                <div className={`flex items-center justify-between p-3 rounded-lg font-semibold ${columnHeaderColors[column.id]}`}>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm lg:text-base">{column.title}</h3>
                    <Badge variant="secondary" className="bg-white/30 text-gray-900">
                      {column.items.length}
                    </Badge>
                  </div>
                  {canEdit && onAdd && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onAdd(column.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[500px] space-y-2 p-3 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-blue-100' : columnColors[column.id]
                        }`}
                    >
                      {column.items.map((item, index) => (
                        <Draggable
                          key={item.id}
                          draggableId={item.id}
                          index={index}
                          isDragDisabled={!canEdit}
                        >
                          {(provided, snapshot) => (
                            <KanbanCard
                              item={item}
                              canEdit={canEdit}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              provided={provided}
                              snapshot={snapshot}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}