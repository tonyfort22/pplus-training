"use client"

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { cn } from '@/lib/utils'

export function KanbanBoard({ className, onDragEnd, children }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className={cn('grid gap-3', className)}>{children}</div>
    </DndContext>
  )
}

export function KanbanColumn({ className, columnId, itemIds = [], children, ...props }) {
  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
      <div className={cn('grid gap-3', className)} {...props}>
        {children}
      </div>
    </SortableContext>
  )
}

export function KanbanItem({ id, columnId, className, children, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: {
      type: 'kanban-item',
      columnId,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging ? 'z-20 opacity-85' : '', className)}
      {...attributes}
      {...listeners}
      {...props}
    >
      {typeof children === 'function' ? children({ isDragging, attributes, listeners }) : children}
    </div>
  )
}
