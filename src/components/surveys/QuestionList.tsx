import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BarChart3, CircleDot, GripVertical, ListChecks, Star, Type } from 'lucide-react';
import type { Question } from '@/types/research';
import { typeLabels } from '@/lib/survey-utils';
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';

export const questionIcons = {
  single_choice: CircleDot,
  multiple_choice: ListChecks,
  text: Type,
  rating: Star,
  nps: BarChart3,
};

function QuestionSummary({ question, index }: { question: Question; index: number }) {
  const Icon = questionIcons[question.type];
  return (
    <>
      <span className="question-position mt-0.5 text-[12px] text-slate-400">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="min-w-0">
        <span className="line-clamp-2 text-[13px] font-medium leading-5">
          {question.title || 'Untitled question'}
        </span>
        <span className="mt-1.5 flex items-center gap-1 text-[12px] text-slate-400">
          <Icon size={10} />
          {typeLabels[question.type]}
        </span>
      </span>
    </>
  );
}

function SortableQuestion({
  question,
  index,
  selected,
  readOnly,
  reducedMotion,
  onSelect,
}: {
  question: Question;
  index: number;
  selected: boolean;
  readOnly: boolean;
  reducedMotion: boolean;
  onSelect: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
    disabled: readOnly,
    transition: reducedMotion ? null : { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  });
  return (
    <div
      ref={setNodeRef}
      role="listitem"
      data-question-id={question.id}
      className={cn(
        'question-list-item sortable-question',
        selected && 'selected',
        isDragging && 'is-dragging',
      )}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        type="button"
        className="question-select flex min-w-0 flex-1 items-start gap-2.5 p-3 text-left"
        onClick={() => onSelect(question.id)}
        aria-pressed={selected}
      >
        <QuestionSummary question={question} index={index} />
      </button>
      {!readOnly && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="question-drag-handle"
          aria-label={`Reorder question ${index + 1}`}
          title="Drag to reorder. Space to pick up, arrow keys to move, Space to drop, Escape to cancel."
        >
          <GripVertical size={16} />
        </button>
      )}
    </div>
  );
}

export function QuestionList({
  questions,
  selectedId,
  readOnly,
  onSelect,
  onReorder,
}: {
  questions: Question[];
  selectedId: string;
  readOnly: boolean;
  onSelect: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const dropPosition = useRef<number | null>(null);
  const horizontal = useMediaQuery('(max-width: 767px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const activeIndex = questions.findIndex((question) => question.id === activeId);
  const active = questions[activeIndex];

  useEffect(() => {
    const element = list.current;
    const item = element?.querySelector<HTMLElement>(
      '.question-select[aria-pressed="true"]',
    )?.parentElement;
    if (!element || !item || activeId || element.scrollWidth <= element.clientWidth) return;
    const bounds = element.getBoundingClientRect();
    const selectedBounds = item.getBoundingClientRect();
    if (selectedBounds.left < bounds.left) element.scrollLeft += selectedBounds.left - bounds.left;
    else if (selectedBounds.right > bounds.right)
      element.scrollLeft += selectedBounds.right - bounds.right;
  }, [selectedId, activeId, horizontal]);

  function finish({ active: dragged, over }: DragEndEvent) {
    setActiveId(null);
    if (readOnly || !over || dragged.id === over.id) return;
    const from = questions.findIndex((question) => question.id === dragged.id);
    const to = questions.findIndex((question) => question.id === over.id);
    if (from >= 0 && to >= 0) {
      dropPosition.current = to + 1;
      onReorder(from, to);
    }
  }
  const position = (id: string | number) =>
    questions.findIndex((question) => question.id === id) + 1;
  return (
    <DndContext
      sensors={sensors}
      modifiers={[
        ({ transform }) => ({
          ...transform,
          x: horizontal ? transform.x : 0,
          y: horizontal ? 0 : transform.y,
        }),
      ]}
      collisionDetection={(args) => {
        const bounds = list.current?.getBoundingClientRect();
        if (args.pointerCoordinates && bounds) {
          const { x, y } = args.pointerCoordinates;
          if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return [];
        }
        return closestCenter(args);
      }}
      onDragStart={({ active }) => {
        dropPosition.current = null;
        setActiveId(String(active.id));
      }}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={finish}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            'To reorder a question, press Space to pick it up. Use the arrow keys to move it, then press Space to drop it, or Escape to cancel.',
        },
        announcements: {
          onDragStart: ({ active }) =>
            `Picked up question ${position(active.id)} of ${questions.length}.`,
          onDragOver: ({ over }) =>
            over
              ? `Drop at position ${position(over.id)} of ${questions.length}.`
              : 'Outside the question list.',
          onDragEnd: ({ active, over }) =>
            over
              ? `Question moved to position ${dropPosition.current ?? position(active.id)} of ${questions.length}.`
              : `Question ${position(active.id)} was not moved.`,
          onDragCancel: () => 'Reordering cancelled. Question order is unchanged.',
        },
      }}
    >
      <SortableContext
        items={questions.map((question) => question.id)}
        strategy={horizontal ? horizontalListSortingStrategy : verticalListSortingStrategy}
      >
        <div
          ref={list}
          className="question-sortable-list space-y-2"
          role="list"
          aria-label="Survey questions"
          data-dragging={activeId !== null}
        >
          {questions.map((question, index) => (
            <SortableQuestion
              key={question.id}
              question={question}
              index={index}
              selected={question.id === selectedId}
              readOnly={readOnly}
              reducedMotion={reducedMotion}
              onSelect={onSelect}
            />
          ))}
        </div>
      </SortableContext>
      {createPortal(
        <DragOverlay
          dropAnimation={
            reducedMotion ? null : { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
          }
        >
          {active && (
            <div className="question-list-item question-drag-overlay" aria-hidden="true">
              <div className="flex min-w-0 flex-1 items-start gap-2.5 p-3 text-left">
                <QuestionSummary question={active} index={activeIndex} />
              </div>
              <span className="question-drag-handle">
                <GripVertical size={16} />
              </span>
            </div>
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}
