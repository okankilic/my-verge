import React, { useEffect, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { BucketItem, CategoryDefinition } from '../types';
import { ItemRow } from './ItemRow';

interface JournalListProps {
  items: BucketItem[];
  categories: CategoryDefinition[];
  onToggleComplete: (item: BucketItem) => void;
  onToggleStarted: (item: BucketItem) => void;
  onDelete: (id: string) => void;
  onSelect: (item: BucketItem) => void;
  onReorder: (orderedIds: string[]) => void;
}

// Journal feed whose order the user sets by pressing and holding an item for 2 seconds, then dragging it.
// The order is kept locally while dragging and committed once on drop.
export const JournalList: React.FC<JournalListProps> = ({
  items,
  categories,
  onToggleComplete,
  onToggleStarted,
  onDelete,
  onSelect,
  onReorder,
}) => {
  const idsKey = items.map((i) => i.id).join('|');
  const [order, setOrder] = useState<string[]>(() => items.map((i) => i.id));
  const [syncedKey, setSyncedKey] = useState(idsKey);
  const orderRef = useRef(order);

  // Re-sync with the incoming list whenever it changes (filters, search, edits)
  if (syncedKey !== idsKey) {
    const ids = items.map((i) => i.id);
    setSyncedKey(idsKey);
    setOrder(ids);
    orderRef.current = ids;
  }

  const byId = new Map(items.map((i) => [i.id, i]));

  const handleReorder = (next: string[]) => {
    orderRef.current = next;
    setOrder(next);
  };

  const commit = () => {
    if (orderRef.current.join('|') !== idsKey) onReorder(orderRef.current);
  };

  return (
    <Reorder.Group
      as="div"
      axis="y"
      values={order}
      onReorder={handleReorder}
      className="space-y-2 sm:space-y-2.5"
    >
      {order.map((id) => {
        const item = byId.get(id);
        if (!item) return null;
        return (
          <JournalListItem
            key={id}
            item={item}
            categoryDef={categories.find((c) => c.id === item.categoryId)}
            onToggleComplete={onToggleComplete}
            onToggleStarted={onToggleStarted}
            onDelete={onDelete}
            onSelect={onSelect}
            onDragEnd={commit}
          />
        );
      })}
    </Reorder.Group>
  );
};

interface JournalListItemProps {
  item: BucketItem;
  categoryDef?: CategoryDefinition;
  onToggleComplete: (item: BucketItem) => void;
  onToggleStarted: (item: BucketItem) => void;
  onDelete: (id: string) => void;
  onSelect: (item: BucketItem) => void;
  onDragEnd: () => void;
}

const LONG_PRESS_MS = 2000;
// Moving further than this before the long press fires means the user is scrolling
const LONG_PRESS_MOVE_TOLERANCE_PX = 8;
// A click arriving this soon after a long press ends belongs to that press, not a tap
const CLICK_SUPPRESS_MS = 500;

// Stops the page from scrolling while an item is being dragged on touch screens
const blockTouchScroll = (e: TouchEvent) => {
  if (e.cancelable) e.preventDefault();
};

const JournalListItem: React.FC<JournalListItemProps> = ({ item, onDragEnd, ...rowProps }) => {
  const controls = useDragControls();
  const [isLifted, setIsLifted] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const liftEndedAt = useRef(0);

  const cancelPress = () => {
    if (pressTimer.current !== null) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
    pressStart.current = null;
  };

  useEffect(() => cancelPress, []);

  const lift = (event: PointerEvent) => {
    pressTimer.current = null;
    setIsLifted(true);
    navigator.vibrate?.(30);
    document.addEventListener('touchmove', blockTouchScroll, { passive: false });

    const drop = () => {
      setIsLifted(false);
      liftEndedAt.current = Date.now();
      document.removeEventListener('touchmove', blockTouchScroll);
      window.removeEventListener('pointerup', drop);
      window.removeEventListener('pointercancel', drop);
    };
    window.addEventListener('pointerup', drop);
    window.addEventListener('pointercancel', drop);

    controls.start(event);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    cancelPress();
    pressStart.current = { x: e.clientX, y: e.clientY };
    const nativeEvent = e.nativeEvent;
    pressTimer.current = window.setTimeout(() => lift(nativeEvent), LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pressStart.current || pressTimer.current === null) return;
    const dx = e.clientX - pressStart.current.x;
    const dy = e.clientY - pressStart.current.y;
    if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE_PX) cancelPress();
  };

  // Swallow the click that ends a long press so it doesn't open the item or press a button
  const handleClickCapture = (e: React.MouseEvent) => {
    if (isLifted || Date.now() - liftEndedAt.current < CLICK_SUPPRESS_MS) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Reorder.Item
      as="div"
      value={item.id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      onClickCapture={handleClickCapture}
      onContextMenu={(e) => e.preventDefault()}
      animate={{ scale: isLifted ? 1.03 : 1 }}
      style={{ WebkitTouchCallout: 'none' }}
      className={`relative select-none rounded-xl transition-shadow ${
        isLifted ? 'z-10 shadow-lg ring-2 ring-ink/20' : ''
      }`}
    >
      <ItemRow item={item} {...rowProps} />
    </Reorder.Item>
  );
};
