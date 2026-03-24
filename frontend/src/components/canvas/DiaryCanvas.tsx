import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Group } from 'react-konva';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { useEventStore } from '../../stores/eventStore';
import type { CanvasElement, Position } from '../../types/canvas';
import { CanvasToolbar } from './CanvasToolbar';
import { ElementSidebar } from './ElementSidebar';



export function DiaryCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  const {
    currentEntry,
    selectedElementId,
    zoom,
    createNewEntry,
    addElement,
    updateElement,
    selectElement,
    setZoom,
    updateCanvasSize,
  } = useCanvasStore();

  const events = useEventStore(state => state.events);
  const selectedEvent = useEventStore(state => state.selectedEventId);
  const selectEvent = useEventStore(state => state.selectEvent);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showSidebar, setShowSidebar] = useState(true);

  // Initialize canvas immediately if not exists
  useEffect(() => {
    if (!currentEntry) {
      // Use window dimensions or fallback to reasonable defaults
      const width = Math.max(window.innerWidth - 400, 800);
      const height = Math.max(window.innerHeight - 200, 600);
      createNewEntry('Untitled Diary', { width, height });
    }
  }, [currentEntry, createNewEntry]);

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(updateSize);
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Auto-resize canvas when container size changes significantly
  useEffect(() => {
    if (currentEntry && containerSize.width > 0 && containerSize.height > 0) {
      const newWidth = Math.max(containerSize.width - 64, 800);
      const newHeight = Math.max(containerSize.height - 64, 600);

      // Only resize if the difference is significant (>100px)
      const widthDiff = Math.abs(newWidth - currentEntry.canvasSize.width);
      const heightDiff = Math.abs(newHeight - currentEntry.canvasSize.height);

      if (widthDiff > 100 || heightDiff > 100) {
        updateCanvasSize({ width: newWidth, height: newHeight });
      }
    }
  }, [containerSize, currentEntry, updateCanvasSize]);

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const selectedNode = stage.findOne(`#${selectedElementId}`);

    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer().batchDraw();
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedElementId]);

  // Handle stage click (deselect)
  const handleStageClick = useCallback((e: any) => {
    if (e.target === stageRef.current) {
      selectElement(null);
    }
  }, [selectElement]);

  // Handle element drag
  const handleElementDragEnd = useCallback((id: string, newPos: Position) => {
    updateElement(id, { position: newPos });
  }, [updateElement]);

  // Handle element transform
  const handleElementTransformEnd = useCallback((id: string, node: any) => {
    // Get actual unscaled size
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    updateElement(id, {
      position: { x: node.x(), y: node.y() },
      width: Math.max(50, node.width() * scaleX),
      height: Math.max(50, node.height() * scaleY),
      rotation: node.rotation(),
    });
    
    // Reset scale to 1 after applying to width/height to avoid compounding
    node.scaleX(1);
    node.scaleY(1);
  }, [updateElement]);

  // Add text element
  const addTextElement = useCallback(() => {
    const element: CanvasElement = {
      id: crypto.randomUUID(),
      type: 'text',
      position: { x: 100, y: 100 },
      width: 200,
      height: 50,
      rotation: 0,
      zIndex: Date.now(),
      locked: false,
      content: 'Double click to edit',
      style: {
        fontSize: 16,
        fontFamily: 'sans-serif',
        fontWeight: 'normal',
        color: '#1f2937',
      },
    };
    addElement(element);
    selectElement(element.id);
  }, [addElement, selectElement]);

  // Add event as card
  const addEventCard = useCallback((eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const element: CanvasElement = {
      id: crypto.randomUUID(),
      type: 'event-card',
      position: { x: 100, y: 100 },
      width: 280,
      height: 180,
      rotation: 0,
      zIndex: Date.now(),
      locked: false,
      eventId,
      event,
    };
    addElement(element);
    selectElement(element.id);
  }, [events, addElement, selectElement]);

  // Handle drop from event list
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!stageRef.current) return;

    // Get pointer position relative to the stage
    stageRef.current.setPointersPositions(e);
    const pointerPos = stageRef.current.getPointerPosition();
    
    if (!pointerPos) return;

    // Calculate position adjusting for zoom
    const x = pointerPos.x;
    const y = pointerPos.y;

    const type = e.dataTransfer.getData('type');

    if (type === 'event-card') {
      const eventId = e.dataTransfer.getData('eventId');
      if (eventId) {
        const event = events.find(ev => ev.id === eventId);
        if (event) {
          const element: CanvasElement = {
            id: crypto.randomUUID(),
            type: 'event-card',
            position: { x: x - 140, y: y - 90 }, // Center card on drop
            width: 280,
            height: 180,
            rotation: 0,
            zIndex: Date.now(),
            locked: false,
            eventId,
            event,
          };
          addElement(element);
          selectElement(element.id);
        }
      }
    } else if (type === 'media') {
      const mediaUrl = e.dataTransfer.getData('mediaUrl');
      if (mediaUrl) {
        const element: CanvasElement = {
          id: crypto.randomUUID(),
          type: 'image',
          position: { x: x - 100, y: y - 75 }, // Center on drop
          width: 200,
          height: 150,
          rotation: 0,
          zIndex: Date.now(),
          locked: false,
          mediaUrl,
          style: {},
        };
        addElement(element);
        selectElement(element.id);
      }
    }
  }, [stageRef, events, addElement, selectElement]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  if (!currentEntry) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-500">Loading canvas...</div>
      </div>
    );
  }

  const canvasWidth = currentEntry.canvasSize.width;
  const canvasHeight = currentEntry.canvasSize.height;

  return (
    <div className="flex h-full bg-zinc-100 dark:bg-zinc-900">
      {/* Left Sidebar - Events List */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-white dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 flex-shrink-0 overflow-hidden"
          >
            <ElementSidebar
              events={events}
              selectedEventId={selectedEvent}
              onSelectEvent={selectEvent}
              onAddEventCard={addEventCard}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <CanvasToolbar
          onAddText={addTextElement}
          onZoomIn={() => setZoom(zoom + 0.1)}
          onZoomOut={() => setZoom(zoom - 0.1)}
          zoom={zoom}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          showSidebar={showSidebar}
        />

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto p-8"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div
            className="mx-auto bg-white dark:bg-zinc-950 shadow-2xl rounded-lg overflow-hidden"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            <Stage
              ref={stageRef}
              width={canvasWidth}
              height={canvasHeight}
              onClick={handleStageClick}
              onTap={handleStageClick}
            >
              <Layer>
                {/* Background */}
                <Rect
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  fill="transparent"
                />

                {/* Elements */}
                {currentEntry.elements
                  .sort((a: CanvasElement, b: CanvasElement) => a.zIndex - b.zIndex)
                  .map((element: CanvasElement) => (
                    <CanvasElementRenderer
                      key={element.id}
                      element={element}
                      isSelected={selectedElementId === element.id}
                      onSelect={() => selectElement(element.id)}
                      onDragEnd={(pos) => handleElementDragEnd(element.id, pos)}
                      onTransformEnd={(node) => handleElementTransformEnd(element.id, node)}
                    />
                  ))}

                {/* Transformer */}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 50 || newBox.height < 50) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
}

// Canvas Element Renderer Component
interface CanvasElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (pos: Position) => void;
  onTransformEnd: (node: any) => void;
}

function CanvasElementRenderer({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: CanvasElementRendererProps) {
  const shapeRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && shapeRef.current) {
      // Transformer will be attached via the parent component
    }
  }, [isSelected]);

  const commonProps = {
    id: element.id,
    x: element.position.x,
    y: element.position.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    draggable: !element.locked,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: (e: any) => {
      onDragEnd({ x: e.target.x(), y: e.target.y() });
    },
    onTransformEnd: (e: any) => {
      onTransformEnd(e.target);
    },
  };

  // Render based on type
  switch (element.type) {
    case 'text':
      return (
        <Text
          ref={shapeRef}
          {...commonProps}
          text={element.content || ''}
          fontSize={element.style?.fontSize || 16}
          fontFamily={element.style?.fontFamily || 'Inter, system-ui, sans-serif'}
          fill={element.style?.color || '#1f2937'}
          align={element.style?.textAlign || 'left'}
          verticalAlign="top"
          padding={4}
          wrap="word"
          lineHeight={1.5}
          // Transformer should scale font size, but we handle it via width/height
          // To prevent corruption, ensure we don't have sub-pixel rendering issues
          listening={!element.locked}
        />
      );

    case 'event-card':
      return (
        <EventCardRenderer
          ref={shapeRef}
          {...commonProps}
          element={element}
          isSelected={isSelected}
        />
      );

    case 'image':
      return (
        <MediaRenderer
          ref={shapeRef}
          {...commonProps}
          element={element}
          isSelected={isSelected}
        />
      );

    default:
      return null;
  }
}

// Event Card with Media Support
interface EventCardRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  draggable: boolean;
  onClick: () => void;
  onTap: () => void;
  onDragEnd: (e: any) => void;
  onTransformEnd: (e: any) => void;
}

const EventCardRenderer = React.forwardRef<any, EventCardRendererProps>(
  ({ element, isSelected, width, height, ...rest }, ref) => {
    const cardHeight = height;
    const hasMedia = element.event?.media && element.event.media.length > 0;
    const mediaCount = element.event?.media?.length || 0;
    const headerHeight = hasMedia ? Math.min(cardHeight * 0.35, 120) : 0;

    return (
      <Group ref={ref} {...rest}>
        {/* Card background */}
        <Rect
          width={width}
          height={cardHeight}
          fill="#ffffff"
          cornerRadius={12}
          stroke={isSelected ? '#3b82f6' : '#e5e7eb'}
          strokeWidth={isSelected ? 2 : 1}
          shadowColor="rgba(0,0,0,0.1)"
          shadowBlur={10}
          shadowOffsetY={4}
        />

        {/* Media Header */}
        {hasMedia && (
          <Group clip={{ x: 12, y: 12, width: width - 24, height: headerHeight - 12 }}>
            {element.event!.media!.slice(0, 4).map((media, idx) => {
              const cols = Math.min(mediaCount, 2);
              const rows = Math.ceil(Math.min(mediaCount, 4) / cols);
              const cellWidth = (width - 24 - (cols - 1) * 4) / cols;
              const cellHeight = (headerHeight - 12 - (rows - 1) * 4) / rows;
              const col = idx % cols;
              const row = Math.floor(idx / cols);
              const x = 12 + col * (cellWidth + 4);
              const y = 12 + row * (cellHeight + 4);

              return (
                <Group key={idx} x={x} y={y}>
                  <Rect
                    width={cellWidth}
                    height={cellHeight}
                    cornerRadius={6}
                    fill="#f3f4f6"
                  />
                  {media.type === 'image' && media.thumbnail ? (
                    <ImageElement
                      url={media.thumbnail}
                      width={cellWidth}
                      height={cellHeight}
                      cornerRadius={6}
                    />
                  ) : (
                    <Group>
                      <Text
                        x={cellWidth / 2}
                        y={cellHeight / 2}
                        text="视频"
                        fontSize={10}
                        fill="#9ca3af"
                        align="center"
                        verticalAlign="middle"
                      />
                    </Group>
                  )}
                </Group>
              );
            })}
          </Group>
        )}

        {/* Event title */}
        <Text
          x={16}
          y={hasMedia ? headerHeight + 12 : 16}
          width={width - 32}
          text={element.event?.userTitle || element.event?.title || 'Untitled'}
          fontSize={14}
          fontStyle="bold"
          fontFamily="Inter, system-ui, sans-serif"
          fill="#111827"
          wrap="none"
          ellipsis={true}
        />
        
        {/* Event time */}
        <Text
          x={16}
          y={hasMedia ? headerHeight + 34 : 38}
          text={`${element.event?.startHms || ''} - ${element.event?.endHms || ''}`}
          fontSize={11}
          fontFamily="Inter, system-ui, sans-serif"
          fill="#6b7280"
        />

        {/* Event summary */}
        <Text
          x={16}
          y={hasMedia ? headerHeight + 52 : 56}
          width={width - 32}
          height={cardHeight - (hasMedia ? headerHeight + 82 : 86)}
          text={element.event?.userSummary || element.event?.summary || ''}
          fontSize={11}
          fontFamily="Inter, system-ui, sans-serif"
          fill="#4b5563"
          wrap="word"
          lineHeight={1.4}
          ellipsis={true}
        />

        {/* Tags */}
        {element.event?.tags && element.event.tags.length > 0 && (
          <Group>
            {element.event.tags.slice(0, 3).map((tag, idx) => (
              <Group key={tag} x={16 + idx * 50}>
                <Rect
                  width={45}
                  height={18}
                  cornerRadius={4}
                  fill="#dbeafe"
                  opacity={0.6}
                />
                <Text
                  x={6}
                  y={3}
                  text={tag}
                  fontSize={9}
                  fill="#2563eb"
                />
              </Group>
            ))}
          </Group>
        )}
      </Group>
    );
  }
);

// Image Component for Konva
interface ImageElementProps {
  url: string;
  width: number;
  height: number;
  cornerRadius?: number;
}

function ImageElement({ url, width, height }: ImageElementProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => setImage(img);
  }, [url]);

  if (!image) return null;

  return <KonvaImage image={image} width={width} height={height} />;
}

// Media Renderer for standalone images/videos
const MediaRenderer = React.forwardRef<any, {
  element: CanvasElement;
  isSelected: boolean;
  [key: string]: any;
}>(({ element, isSelected, ...rest }, ref) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (element.mediaUrl) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = element.mediaUrl;
      img.onload = () => setImage(img);
    }
  }, [element.mediaUrl]);

  return (
    <Group ref={ref} {...rest}>
      <Rect
        width={element.width}
        height={element.height}
        cornerRadius={8}
        fill="#f3f4f6"
        stroke={isSelected ? '#3b82f6' : '#e5e7eb'}
        strokeWidth={isSelected ? 2 : 1}
      />
      {image && (
        <KonvaImage
          image={image}
          x={4}
          y={4}
          width={element.width - 8}
          height={element.height - 8}
          cornerRadius={8}
        />
      )}
    </Group>
  );
});