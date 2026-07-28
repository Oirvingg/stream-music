import React, { useState } from 'react';

interface DraggableTrackRowProps {
  index: number;
  onReorder: (startIndex: number, endIndex: number) => void;
  className?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function DraggableTrackRow({
  index,
  onReorder,
  className = '',
  children,
  onClick,
  onContextMenu
}: DraggableTrackRowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragDirection, setDragDirection] = useState<'top' | 'bottom' | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    // Use timeout to allow the native drag image to be generated before we change opacity
    setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDragOver(false);
    setDragDirection(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    if (relativeY < rect.height / 2) {
      setDragDirection('top');
    } else {
      setDragDirection('bottom');
    }
    
    // Ensure state is updated correctly for dragging over
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Only reset if we actually leave the element boundaries
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left || 
      e.clientX > rect.right || 
      e.clientY < rect.top || 
      e.clientY > rect.bottom
    ) {
      setIsDragOver(false);
      setDragDirection(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragDirection(null);

    const startIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(startIndex) || startIndex === index) return;

    onReorder(startIndex, index);
  };

  let dragClasses = '';
  if (isDragging) {
    dragClasses = 'opacity-40 scale-[0.98] cursor-grabbing border border-red-500 bg-zinc-800';
  } else if (isDragOver && dragDirection === 'top') {
    dragClasses = 'border-t-2 border-t-red-500';
  } else if (isDragOver && dragDirection === 'bottom') {
    dragClasses = 'border-b-2 border-b-red-500';
  } else {
    // Only apply default transparent borders if not actively highlighted to avoid UI jumping
    dragClasses = 'border-y-2 border-transparent';
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`transition-all duration-200 ${className} ${dragClasses}`}
    >
      {children}
    </div>
  );
}
