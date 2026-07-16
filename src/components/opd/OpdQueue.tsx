"use client";

import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { OpdVisit } from "@/types/opd";
import { Printer, Trash2, GripVertical, Save, X } from "lucide-react";
import { useOpdApi } from "@/hooks/useOpdApi";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  visits: OpdVisit[];
  onPatientClick: (visit: OpdVisit) => void;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  waiting: { label: "Waiting", color: "text-amber-400", bgColor: "bg-amber-500/15" },
  vitals_done: { label: "Vitals Done", color: "text-blue-400", bgColor: "bg-blue-500/15" },
  in_consultation: { label: "In Consultation", color: "text-purple-400", bgColor: "bg-purple-500/15" },
  completed: { label: "Completed", color: "text-emerald-400", bgColor: "bg-emerald-500/15" },
};

function SortableVisitCard({
  visit,
  onPatientClick,
  arrangeMode,
}: {
  visit: OpdVisit;
  onPatientClick: (visit: OpdVisit) => void;
  arrangeMode: string;
}) {
  const opdPatients = useAppStore((s) => s.opdPatients);
  const removeOpdVisit = useAppStore((s) => s.removeOpdVisit);
  const { deleteVisit } = useOpdApi();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: visit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const getPatientName = (patientId: string) =>
    opdPatients.find((p) => p.id === patientId)?.name ?? "Unknown";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex w-full flex-col rounded-lg border bg-neutral-800/50 hover:border-neutral-700 hover:bg-neutral-800 transition-colors ${
        isDragging ? "border-blue-500 shadow-xl opacity-90" : "border-transparent"
      }`}
    >
      <div className="flex w-full items-center gap-3 px-3 py-2 text-left">
        {arrangeMode === "appointment" && (
          <div
            {...attributes}
            {...listeners}
            className="flex cursor-grab items-center justify-center p-1 text-neutral-500 hover:text-neutral-300 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <button
          onClick={() => onPatientClick(visit)}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xs font-bold text-white">
            {visit.tokenNo}
          </span>
          <div className="min-w-0 flex-1 pr-16">
            <p className="truncate text-sm text-white">{getPatientName(visit.patientId)}</p>
            <p className="text-[10px] text-neutral-500">
              {new Date(visit.createdAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {visit.bill ? ` · ₹${visit.bill.totalAmount}` : ""}
            </p>
          </div>
          {arrangeMode === "appointment" && (
            <span
              className={`hidden sm:block absolute right-20 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                STATUS_CONFIG[visit.status]?.bgColor
              } ${STATUS_CONFIG[visit.status]?.color}`}
            >
              {STATUS_CONFIG[visit.status]?.label}
            </span>
          )}
        </button>
      </div>

      {/* Actions */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(`/opd/print-prescription/${visit.id}`, "_blank");
          }}
          title="Print Prescription"
          className="flex h-7 w-7 items-center justify-center rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
        >
          <Printer className="h-4 w-4" />
        </button>
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (!confirm("Are you sure you want to remove this patient from the queue?")) {
              return;
            }

            const deleted = await deleteVisit(visit.id);
            if (deleted) {
              removeOpdVisit(visit.id);
            }
          }}
          title="Remove from queue"
          className="flex h-7 w-7 items-center justify-center rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function OpdQueue({ visits, onPatientClick }: Props) {
  const [arrangeMode, setArrangeMode] = useState<"status" | "appointment">("status");
  const [draftVisits, setDraftVisits] = useState<OpdVisit[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { bulkUpdateVisits } = useOpdApi();
  const bulkUpdateStore = useAppStore((s) => s.bulkUpdateOpdVisitTokens);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => a.tokenNo - b.tokenNo);
  }, [visits]);

  useEffect(() => {
    setDraftVisits(sortedVisits);
  }, [sortedVisits]);

  const grouped = useMemo(() => {
    const groups: Record<string, OpdVisit[]> = {
      waiting: [],
      vitals_done: [],
      in_consultation: [],
      completed: [],
    };
    visits.forEach((v) => {
      groups[v.status]?.push(v);
    });
    return groups;
  }, [visits]);

  const totalRevenue = useMemo(
    () => visits.reduce((sum, v) => sum + (v.bill?.totalAmount ?? 0), 0),
    [visits]
  );

  const hasChanges = useMemo(() => {
    if (draftVisits.length !== sortedVisits.length) return false;
    for (let i = 0; i < draftVisits.length; i++) {
      if (draftVisits[i].id !== sortedVisits[i].id) return true;
    }
    return false;
  }, [draftVisits, sortedVisits]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setDraftVisits((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    // Extract tokens in ascending order
    const tokens = draftVisits.map(v => v.tokenNo).sort((a, b) => a - b);
    
    const updates = draftVisits.map((visit, index) => ({
      id: visit.id,
      tokenNo: tokens[index],
    }));

    bulkUpdateStore(updates);
    await bulkUpdateVisits(updates);
    setIsSaving(false);
  };

  const handleCancelOrder = () => {
    setDraftVisits(sortedVisits);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">Today&apos;s Queue</h3>
        <select
          value={arrangeMode}
          onChange={(e) => setArrangeMode(e.target.value as any)}
          className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-white"
        >
          <option value="status">Group by Status</option>
          <option value="appointment">Sort by Appointment</option>
        </select>
      </div>
      <p className="mb-4 text-xs text-neutral-500">
        {visits.length} patients · ₹{totalRevenue.toLocaleString("en-IN")} revenue
      </p>

      {arrangeMode === "appointment" && hasChanges && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-500/10 p-2 border border-blue-500/20">
          <span className="text-xs text-blue-400">Order changed</span>
          <div className="flex gap-2">
            <button
              onClick={handleCancelOrder}
              disabled={isSaving}
              className="flex items-center gap-1 rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-400 hover:text-white"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
            <button
              onClick={handleSaveOrder}
              disabled={isSaving}
              className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <Save className="h-3 w-3" />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-hide">
        {arrangeMode === "status" ? (
          (["waiting", "vitals_done", "in_consultation", "completed"] as const).map((status) => {
            const group = grouped[status] || [];
            if (group.length === 0) return null;
            const config = STATUS_CONFIG[status];

            return (
              <div key={status}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.bgColor} ${config.color}`}
                  >
                    {config.label}
                  </span>
                  <span className="text-xs text-neutral-500">{group.length}</span>
                </div>
                <div className="space-y-1">
                  {group
                    .sort((a, b) => a.tokenNo - b.tokenNo)
                    .map((visit) => (
                      <SortableVisitCard
                        key={visit.id}
                        visit={visit}
                        onPatientClick={onPatientClick}
                        arrangeMode={arrangeMode}
                      />
                    ))}
                </div>
              </div>
            );
          })
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={draftVisits.map((v) => v.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {draftVisits.map((visit) => (
                  <SortableVisitCard
                    key={visit.id}
                    visit={visit}
                    onPatientClick={onPatientClick}
                    arrangeMode={arrangeMode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {visits.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-neutral-500">No patients today</p>
          </div>
        )}
      </div>
    </div>
  );
}
