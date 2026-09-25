import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FiPlay, 
  FiPause, 
  FiSquare, 
  FiZoomIn, 
  FiZoomOut, 
  FiVideo, 
  FiMusic, 
  FiType,
  FiTrash2,
  FiCopy,
  FiEdit2,
  FiCheck,
  FiZap,
  FiFilm,
  FiScissors
} from 'react-icons/fi';
import styles from './Timeline.module.css';

import type { 
  VideoProperties, 
  SpeedProperties, 
  AnimationPreset, 
  AdjustmentProperties 
} from './PropertyInspector';

export interface Clip {
  id: string;
  name: string;
  duration: number; // مدة المقطع الفعلية على الـ Timeline بالثواني
  startTime: number; // وقت بدء المقطع في الخط الزمني بالثواني
  trackId: number;
  type?: 'video' | 'audio' | 'text';
  src?: string;
  trimOffset?: number; // بداية الاقتطاع من الملف الأصلي بالثواني (Source Offset)
  videoProps?: VideoProperties;
  speedProps?: SpeedProperties;
  animation?: AnimationPreset | null;
  adjustmentProps?: AdjustmentProperties;
  speed?: number;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  clipId: string | null;
}

interface TimelineProps {
  currentTime: number;
  duration?: number;
  isPlaying: boolean;
  clips?: Clip[];
  selectedClipId?: string | null;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onClipsChange?: (clips: Clip[]) => void;
  onSelectClip?: (clipId: string | null) => void;
}

type DragMode = 'move' | 'trim-start' | 'trim-end' | 'playhead' | null;

const HEADER_WIDTH = 130;

export const Timeline: React.FC<TimelineProps> = ({
  currentTime = 0,
  duration = 0,
  isPlaying,
  clips: externalClips,
  selectedClipId: externalSelectedClipId,
  onTogglePlay,
  onSeek,
  onClipsChange,
  onSelectClip,
}) => {
  const [zoom, setZoom] = useState<number>(40);
  const [clips, setClips] = useState<Clip[]>(externalClips || []);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(externalSelectedClipId || null);
  
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, clipId: null });
  const [editingClip, setEditingClip] = useState<Clip | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const clipsRef = useRef<Clip[]>(clips);
  const isDraggingRef = useRef<boolean>(false);
  
  const activeDragInfo = useRef<{
    mode: DragMode;
    clipId: string | null;
    startX: number;
    initialStart: number;
    initialDuration: number;
    initialTrimOffset: number;
  }>({ mode: null, clipId: null, startX: 0, initialStart: 0, initialDuration: 0, initialTrimOffset: 0 });

  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;

  const onClipsChangeRef = useRef(onClipsChange);
  onClipsChangeRef.current = onClipsChange;

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const updateClips = useCallback((newClips: Clip[] | ((prev: Clip[]) => Clip[])) => {
    setClips(prev => {
      const updated = typeof newClips === 'function' ? newClips(prev) : newClips;
      clipsRef.current = updated;
      return updated;
    });
  }, []);

  useEffect(() => {
    if (externalClips && !isDraggingRef.current) {
      updateClips(externalClips);
    }
  }, [externalClips, updateClips]);

  useEffect(() => {
    if (externalSelectedClipId !== undefined) {
      setSelectedClipId(externalSelectedClipId);
    }
  }, [externalSelectedClipId]);

  const handleSelectClipInternal = useCallback((id: string | null) => {
    setSelectedClipId(id);
    onSelectClip?.(id);
  }, [onSelectClip]);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) setContextMenu(prev => ({ ...prev, visible: false }));
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [contextMenu.visible]);

  const validCurrentTime = isNaN(currentTime) ? 0 : currentTime;

  const calculatedClipsDuration = clips.reduce((max, clip) => {
    const effectiveDuration = clip.duration || 0;
    return Math.max(max, (clip.startTime || 0) + effectiveDuration);
  }, 0);

  const maxTimelineDuration = Math.max(
    clips.length > 0 ? calculatedClipsDuration : (duration || 20),
    5
  );

  const calculateTimeFromMouseX = useCallback((clientX: number) => {
    if (!workspaceRef.current) return 0;
    const rect = workspaceRef.current.getBoundingClientRect();
    const scrollLeft = workspaceRef.current.scrollLeft;
    const relativeX = clientX - rect.left + scrollLeft - HEADER_WIDTH;
    return Math.max(0, relativeX / zoomRef.current);
  }, []);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const { mode, clipId, startX, initialStart, initialDuration, initialTrimOffset } = activeDragInfo.current;

    if (mode === 'playhead') {
      const mouseTime = calculateTimeFromMouseX(e.clientX);
      onSeekRef.current(Number(mouseTime.toFixed(2)));
      return;
    }

    if (!clipId) return;

    const deltaX = e.clientX - startX;
    const deltaTime = deltaX / zoomRef.current;

    updateClips(prevClips =>
      prevClips.map(clip => {
        if (clip.id !== clipId) return clip;

        const isText = clip.type === 'text' || clip.trackId === 3;
        const speed = isText ? 1.0 : (clip.speed || clip.speedProps?.speed || 1.0);

        if (mode === 'move') {
          const newStart = Math.max(0, initialStart + deltaTime);
          return { ...clip, startTime: Number(newStart.toFixed(2)) };
        }

        if (mode === 'trim-start') {
          const maxTrimStart = initialStart + initialDuration - 0.2;
          const newStart = Math.min(Math.max(0, initialStart + deltaTime), maxTrimStart);
          const timeDiffOnTimeline = newStart - initialStart;
          
          const newDuration = Math.max(0.2, initialDuration - timeDiffOnTimeline);
          const newTrimOffset = Math.max(0, initialTrimOffset + (timeDiffOnTimeline * speed));

          return {
            ...clip,
            startTime: Number(newStart.toFixed(2)),
            duration: Number(newDuration.toFixed(2)),
            trimOffset: Number(newTrimOffset.toFixed(2)),
          };
        }

        if (mode === 'trim-end') {
          const newDuration = Math.max(0.2, initialDuration + deltaTime);
          return { ...clip, duration: Number(newDuration.toFixed(2)) };
        }

        return clip;
      })
    );
  }, [calculateTimeFromMouseX, updateClips]);

  const handleGlobalMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      activeDragInfo.current = { mode: null, clipId: null, startX: 0, initialStart: 0, initialDuration: 0, initialTrimOffset: 0 };
      
      onClipsChangeRef.current?.(clipsRef.current);

      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [handleGlobalMouseMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  const handleClipMouseDown = (e: React.MouseEvent, clip: Clip, mode: DragMode) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    handleSelectClipInternal(clip.id);

    isDraggingRef.current = true;
    activeDragInfo.current = {
      mode,
      clipId: clip.id,
      startX: e.clientX,
      initialStart: clip.startTime,
      initialDuration: clip.duration,
      initialTrimOffset: clip.trimOffset || 0,
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
  };

  // --- إصلاح دالة القص Split ---
  const handleSplitClip = useCallback((targetClipId?: string | null) => {
    const idToSplit = targetClipId || selectedClipId;
    if (!idToSplit) return;

    const targetClip = clipsRef.current.find(c => c.id === idToSplit);
    if (!targetClip) return;

    const isText = targetClip.type === 'text' || targetClip.trackId === 3;
    const speed = isText ? 1.0 : (targetClip.speed || targetClip.speedProps?.speed || 1.0);
    const clipEndTime = targetClip.startTime + targetClip.duration;

    // التحقق من وجود مؤشر التشغيل داخل نطاق المقطع
    if (validCurrentTime <= targetClip.startTime + 0.05 || validCurrentTime >= clipEndTime - 0.05) {
      return;
    }

    // 1. مدة الجزء الأول على الـ Timeline
    const firstClipDurationOnTimeline = validCurrentTime - targetClip.startTime;
    
    // 2. مدة الجزء الثاني على الـ Timeline
    const secondClipDurationOnTimeline = targetClip.duration - firstClipDurationOnTimeline;

    // 3. حساب الإزاحة داخل ملف الصوت/الفيديو الأصلي للجزء الثاني
    const currentTrimOffset = targetClip.trimOffset || 0;
    const mediaTimeConsumedByFirstClip = firstClipDurationOnTimeline * speed;
    const secondClipTrimOffset = currentTrimOffset + mediaTimeConsumedByFirstClip;

    // الجزء الأول: يحتفظ بنفس الـ trimOffset ويبدأ من نفس النقطة ولكنه يتوقف عند وقت القص
    const firstClip: Clip = {
      ...targetClip,
      duration: Number(firstClipDurationOnTimeline.toFixed(2)),
    };

    // الجزء الثاني: يبدأ زمنياً عند مؤشر القص في الـ Timeline، ويأخذ offset الملف الأصلي المحسوب
    const secondClip: Clip = {
      ...targetClip,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${targetClip.name}_part2`,
      startTime: Number(validCurrentTime.toFixed(2)),
      duration: Number(secondClipDurationOnTimeline.toFixed(2)),
      trimOffset: Number(secondClipTrimOffset.toFixed(2)),
    };

    const updatedClips = clipsRef.current.flatMap(c => c.id === idToSplit ? [firstClip, secondClip] : [c]);
    updateClips(updatedClips);
    onClipsChangeRef.current?.(updatedClips);
    handleSelectClipInternal(secondClip.id);
  }, [selectedClipId, validCurrentTime, updateClips, handleSelectClipInternal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if ((e.code === 'Delete' || e.code === 'Backspace') && selectedClipId) {
        const updated = clipsRef.current.filter(c => c.id !== selectedClipId);
        updateClips(updated);
        onClipsChangeRef.current?.(updated);
        handleSelectClipInternal(null);
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        handleSplitClip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, selectedClipId, updateClips, handleSelectClipInternal, handleSplitClip]);

  const handleClipContextMenu = (e: React.MouseEvent, clipId: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelectClipInternal(clipId);
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, clipId });
  };

  const handleDeleteClip = () => {
    if (contextMenu.clipId) {
      const updated = clips.filter(c => c.id !== contextMenu.clipId);
      updateClips(updated);
      onClipsChange?.(updated);
      if (selectedClipId === contextMenu.clipId) handleSelectClipInternal(null);
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleDuplicateClip = () => {
    if (contextMenu.clipId) {
      const targetClip = clips.find(c => c.id === contextMenu.clipId);
      if (targetClip) {
        const duplicatedClip: Clip = {
          ...targetClip,
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: `${targetClip.name}_copy`,
          startTime: Number((targetClip.startTime + targetClip.duration + 0.1).toFixed(2)),
        };
        const updated = [...clips, duplicatedClip];
        updateClips(updated);
        onClipsChange?.(updated);
      }
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const audioUrl = URL.createObjectURL(file);
    const tempAudio = new Audio(audioUrl);

    tempAudio.onloadedmetadata = () => {
      const newClip: Clip = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        duration: Number((tempAudio.duration || 5).toFixed(2)),
        startTime: Number(validCurrentTime.toFixed(2)),
        trackId: 2,
        type: 'audio',
        src: audioUrl,
        trimOffset: 0,
        speedProps: { speed: 1.0, smoothSlowMo: false },
        speed: 1.0,
      };
      const updated = [...clips, newClip];
      updateClips(updated);
      onClipsChange?.(updated);
      handleSelectClipInternal(newClip.id);
      if (audioInputRef.current) audioInputRef.current.value = '';
    };
  };

  const addNewTextClip = () => {
    const textClipsCount = clips.filter(c => c.trackId === 3).length;
    const newClip: Clip = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `نص ${textClipsCount + 1}`,
      duration: 3,
      startTime: Number(validCurrentTime.toFixed(2)),
      trackId: 3,
      type: 'text',
      trimOffset: 0,
      animation: null,
    };
    const updated = [...clips, newClip];
    updateClips(updated);
    onClipsChange?.(updated);
    handleSelectClipInternal(newClip.id);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00.0";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${millis}`;
  };

  const totalTimelineWidth = maxTimelineDuration * zoom + HEADER_WIDTH;

  return (
    <div className={styles['timeline-container']} dir="ltr">
      <input 
        type="file" 
        ref={audioInputRef} 
        onChange={handleAudioFileChange} 
        accept="audio/*" 
        style={{ display: 'none' }} 
      />

      <div className={styles['timeline-toolbar']}>
        <div className={styles['toolbar-left']}>
          <button className={styles['timeline-btn']} onClick={onTogglePlay}>
            {isPlaying ? <FiPause size={14} /> : <FiPlay size={14} />} 
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button className={styles['timeline-btn']} onClick={() => onSeek(0)}>
            <FiSquare size={14} /> <span>Stop</span>
          </button>
          <button 
            className={`${styles['timeline-btn']} ${styles['primary-action']}`} 
            onClick={() => handleSplitClip()}
            disabled={!selectedClipId}
            title="تقسيم المقطع عند رأس التشغيل (Shortcut: S)"
          >
            <FiScissors size={14} /> <span>Split</span>
          </button>
          <button className={`${styles['timeline-btn']} ${styles['audio-action']}`} onClick={() => audioInputRef.current?.click()}>
            <FiMusic size={14} /> <span>Add Audio</span>
          </button>
          <button className={`${styles['timeline-btn']} ${styles['text-action']}`} onClick={addNewTextClip}>
            <FiType size={14} /> <span>Add Text</span>
          </button>
          <span className={styles['time-indicator']}>
            {formatTime(validCurrentTime)} / {formatTime(maxTimelineDuration)}
          </span>
        </div>
        <div className={styles['toolbar-right']}>
          <button className={styles['timeline-btn']} onClick={() => setZoom(p => Math.min(p + 10, 150))}>
            <FiZoomIn size={14} />
          </button>
          <button className={styles['timeline-btn']} onClick={() => setZoom(p => Math.max(p - 10, 15))}>
            <FiZoomOut size={14} />
          </button>
        </div>
      </div>

      <div className={styles['timeline-workspace']} ref={workspaceRef}>
        <div style={{ width: `${totalTimelineWidth}px`, position: 'relative' }}>
          
          <div 
            className={styles['timeline-ruler']} 
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              e.preventDefault();
              isDraggingRef.current = true;
              activeDragInfo.current = {
                mode: 'playhead',
                clipId: null,
                startX: e.clientX,
                initialStart: 0,
                initialDuration: 0,
                initialTrimOffset: 0,
              };
              onSeek(calculateTimeFromMouseX(e.clientX));
              window.addEventListener('mousemove', handleGlobalMouseMove);
              window.addEventListener('mouseup', handleGlobalMouseUp);
            }}
            style={{ paddingLeft: `${HEADER_WIDTH}px` }}
          >
            {[...Array(Math.ceil(maxTimelineDuration) + 1)].map((_, i) => (
              <span key={i} className={styles['ruler-marker']} style={{ width: `${zoom}px` }}>
                {i % 5 === 0 ? `${i}s` : '|'}
              </span>
            ))}
          </div>

          <div className={styles['tracks-wrapper']}>
            {[
              { id: 1, name: 'Video 1', icon: <FiVideo size={14} />, typeKey: 'video-clip' },
              { id: 2, name: 'Audio 1', icon: <FiMusic size={14} />, typeKey: 'audio-clip' },
              { id: 3, name: 'Text 1', icon: <FiType size={14} />, typeKey: 'text-clip' },
            ].map(track => (
              <div key={track.id} className={styles['track']}>
                <div className={styles['track-header']} style={{ width: `${HEADER_WIDTH}px` }}>
                  <span className={styles['track-icon']}>{track.icon}</span>
                  <span className={styles['track-name']}>{track.name}</span>
                </div>
                <div className={styles['track-content']} style={{ position: 'relative', flex: 1 }}>
                  {clips
                    .filter(c => c.trackId === track.id)
                    .map(clip => {
                      const isTextClip = clip.type === 'text' || track.id === 3;
                      const speed = isTextClip ? 1.0 : (clip.speed || clip.speedProps?.speed || 1.0);

                      const isSelected = selectedClipId === clip.id;
                      const hasAnimation = clip.animation && clip.animation.id !== 'none';
                      const hasCustomSpeed = !isTextClip && speed !== 1.0;

                      const clipClasses = [
                        styles['clip-item'],
                        styles[track.typeKey],
                        isSelected ? styles['selected'] : ''
                      ].filter(Boolean).join(' ');

                      return (
                        <div 
                          key={clip.id} 
                          className={clipClasses}
                          style={{ 
                            width: `${clip.duration * zoom}px`,
                            left: `${clip.startTime * zoom}px`,
                            position: 'absolute'
                          }}
                          onMouseDown={(e) => handleClipMouseDown(e, clip, 'move')}
                          onContextMenu={(e) => handleClipContextMenu(e, clip.id)}
                        >
                          <div 
                            className={`${styles['trim-handle']} ${styles['trim-start']}`}
                            onMouseDown={(e) => handleClipMouseDown(e, clip, 'trim-start')}
                          />
                          
                          <div className={styles['clip-info']} style={{ pointerEvents: 'none' }}>
                            <span className={styles['clip-title']}>{clip.name}</span>
                            
                            {!isTextClip && (
                              <div className={styles['clip-badges']}>
                                {hasAnimation && (
                                  <span className={styles['anim-badge']} title={`Animation: ${clip.animation?.name}`}>
                                    <FiFilm size={10} />
                                  </span>
                                )}
                                {hasCustomSpeed && (
                                  <span className={styles['speed-badge']} title={`Speed: ${speed}x`}>
                                    <FiZap size={10} />
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div 
                            className={`${styles['trim-handle']} ${styles['trim-end']}`}
                            onMouseDown={(e) => handleClipMouseDown(e, clip, 'trim-end')}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          <div 
            className={styles['playhead']} 
            style={{ left: `${validCurrentTime * zoom + HEADER_WIDTH}px`, position: 'absolute', zIndex: 10 }}
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              e.preventDefault();
              e.stopPropagation();
              isDraggingRef.current = true;
              activeDragInfo.current = {
                mode: 'playhead',
                clipId: null,
                startX: e.clientX,
                initialStart: 0,
                initialDuration: 0,
                initialTrimOffset: 0,
              };
              window.addEventListener('mousemove', handleGlobalMouseMove);
              window.addEventListener('mouseup', handleGlobalMouseUp);
            }}
          />
        </div>
      </div>

      {contextMenu.visible && (
        <div 
          className={styles['context-menu']} 
          style={{ top: contextMenu.y, left: contextMenu.x, position: 'fixed', zIndex: 100 }}
          onClick={(e) => e.stopPropagation()}
        >
          {clips.find(c => c.id === contextMenu.clipId)?.trackId === 3 && (
            <div className={styles['context-menu-item']} onClick={() => {
              const target = clips.find(c => c.id === contextMenu.clipId);
              if (target) setEditingClip({ ...target });
              setContextMenu(prev => ({ ...prev, visible: false }));
            }}>
              <FiEdit2 size={13} />
              <span>تعديل النص</span>
            </div>
          )}
          <div className={styles['context-menu-item']} onClick={() => {
            handleSplitClip(contextMenu.clipId);
            setContextMenu(prev => ({ ...prev, visible: false }));
          }}>
            <FiScissors size={13} />
            <span>قص المقطع (Split)</span>
          </div>
          <div className={styles['context-menu-item']} onClick={handleDuplicateClip}>
            <FiCopy size={13} />
            <span>تكرار (Duplicate)</span>
          </div>
          <div className={`${styles['context-menu-item']} ${styles['delete']}`} onClick={handleDeleteClip}>
            <FiTrash2 size={13} />
            <span>حذف (Delete)</span>
          </div>
        </div>
      )}

      {editingClip && (
        <div className={styles['text-editor-modal-overlay']}>
          <div className={styles['text-editor-modal']} dir="rtl">
            <div className={styles['modal-header']}>
              <h3><FiType size={16} /> تعديل النص</h3>
            </div>
            <div className={styles['modal-body']}>
              <label>المحتوى:</label>
              <input 
                type="text" 
                value={editingClip.name} 
                onChange={(e) => setEditingClip({ ...editingClip, name: e.target.value })}
              />
            </div>
            <div className={styles['modal-footer']}>
              <button className={styles['cancel-btn']} onClick={() => setEditingClip(null)}>إلغاء</button>
              <button className={styles['save-btn']} onClick={() => {
                const updated = clips.map(c => c.id === editingClip.id ? editingClip : c);
                updateClips(updated);
                onClipsChange?.(updated);
                setEditingClip(null);
              }}>
                <FiCheck size={14} /> حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;