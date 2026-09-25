import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { BillDraftItem } from "@/components/add-bill-modal/types";

interface BillItemsListProps {
  items: BillDraftItem[];
  onRemoveItem: (id: string) => void;
  onReorder: (items: BillDraftItem[]) => void;
}

function SortableItemRow({
  item,
  index,
  onRemoveItem,
  isDragOverlay = false,
}: {
  item: BillDraftItem;
  index: number;
  onRemoveItem: (id: string) => void;
  isDragOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isDragOverlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between bg-neutral-950/50 border rounded-lg px-3 py-2.5 group transition-colors ${
        isDragging
          ? "border-blue-600/60 bg-neutral-900/80 opacity-40"
          : "border-neutral-800 hover:border-neutral-700"
      } ${isDragOverlay ? "border-blue-600 shadow-xl bg-neutral-900" : ""}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-neutral-600 hover:text-neutral-300 cursor-grab active:cursor-grabbing p-1 touch-none shrink-0"
          title="Drag to reorder"
          aria-label={`Drag to reorder ${item.description}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs text-neutral-600 font-mono w-6">{index + 1}.</span>
        <span className="text-sm text-white font-medium truncate">{item.description}</span>
        <span className="text-xs text-neutral-500 whitespace-nowrap">
          Rs {item.rate.toFixed(2)} x {item.quantity}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-neutral-300 whitespace-nowrap">
          Rs {(item.rate * item.quantity).toFixed(2)}
        </span>
        <button
          type="button"
          onClick={() => onRemoveItem(item.id)}
          className="text-neutral-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
          title="Remove item"
          aria-label={`Remove ${item.description}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
        </div>
    </div>
  );
}

export default function BillItemsList({
  items,
  onRemoveItem,
  onReorder,
}: BillItemsListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered);
  };

  return (
    <div className="flex-1 overflow-y-auto pr-1">
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-full text-neutral-600 text-sm">
          No items added yet. Use package or item entry above.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {items.map((item, index) => (
                <SortableItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  onRemoveItem={onRemoveItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
