import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { ZoomIn, ZoomOut, Download } from 'lucide-react';
import ExportModal from './ExportModal';
import styles from './PreviewWindow.module.css';
import type { Clip } from './Timeline';
import type { 
  AnimationPreset, 
  VideoProperties, 
  AdjustmentProperties 
} from './PropertyInspector';

interface Position {
  x: number;
  y: number;
}

interface PreviewWindowProps {
  videoSrc?: string;
  projectName?: string;
  currentTime: number;
  isPlaying: boolean;
  clips?: Clip[];
  textPositions?: Record<string, Position>;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onExport?: () => void;
}

const TRANSITION_DURATION = 0.8;

export const PreviewWindow: React.FC<PreviewWindowProps> = ({ 
  videoSrc = "",
  projectName = "Untitled Project",
  currentTime = 0,
  isPlaying = false,
  clips = [],
  textPositions: externalTextPositions,
  onTimeUpdate,
  onDurationChange,
  onExport
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // المرجعية لتتبع عملية الـ Seek اليدوي لتجنب التعارض
  const isSeekingRef = useRef<boolean>(false);

  // Web Audio API للتحكم في الصوت
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceConnectedRef = useRef<boolean>(false);

  const [zoom, setZoom] = useState<number>(100);
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [isManualAspect, setIsManualAspect] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const [internalTextPositions, setInternalTextPositions] = useState<Record<string, Position>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    setIsManualAspect(false);
  }, [videoSrc]);

  const textPositions = useMemo(() => {
    return { ...internalTextPositions, ...externalTextPositions };
  }, [internalTextPositions, externalTextPositions]);

  // المقطع النشط حالياً في Timeline مع مراعاة مدته الفعلية
  const activeVideoClip = useMemo(() => {
    return clips.find(clip => {
      const isVideoTrack = clip.trackId === 1 || !clip.trackId;
      const effectiveDuration = clip.duration || 0;
      const clipEnd = clip.startTime + effectiveDuration;
      return isVideoTrack && currentTime >= clip.startTime && currentTime <= clipEnd;
    });
  }, [clips, currentTime]);

  // السرعة الحالية
  const currentVideoSpeed = useMemo(() => {
    if (!activeVideoClip) return 1.0;
    const speed = activeVideoClip.speedProps?.speed ?? activeVideoClip.speed ?? 1.0;
    return speed > 0 ? speed : 1.0;
  }, [activeVideoClip]);

  // حساب الأنيميشن
  const activeVideoAnimationClass = useMemo(() => {
    if (!activeVideoClip || !activeVideoClip.animation) return '';

    const anim = activeVideoClip.animation as AnimationPreset;
    if (!anim.className) return '';

    const effectiveDuration = activeVideoClip.duration;

    const clipStart = activeVideoClip.startTime;
    const clipEnd = clipStart + effectiveDuration;
    const timeInClip = currentTime - clipStart;
    const timeRemaining = clipEnd - currentTime;

    if (anim.category === 'in' && timeInClip <= TRANSITION_DURATION) {
      return `animate__animated ${anim.className}`;
    }

    if (anim.category === 'out' && timeRemaining <= TRANSITION_DURATION) {
      return `animate__animated ${anim.className}`;
    }

    if (anim.category === 'combo') {
      return `animate__animated ${anim.className}`;
    }

    return '';
  }, [activeVideoClip, currentTime]);

  const getTextAnimationClass = useCallback((clip: Clip) => {
    if (!clip.animation) return '';

    const anim = clip.animation as AnimationPreset;
    if (!anim.className) return '';

    const effectiveDuration = clip.duration;

    const clipStart = clip.startTime;
    const clipEnd = clipStart + effectiveDuration;
    const timeInClip = currentTime - clipStart;
    const timeRemaining = clipEnd - currentTime;

    if (anim.category === 'in' && timeInClip <= TRANSITION_DURATION) {
      return `animate__animated ${anim.className}`;
    }

    if (anim.category === 'out' && timeRemaining <= TRANSITION_DURATION) {
      return `animate__animated ${anim.className}`;
    }

    if (anim.category === 'combo') {
      return `animate__animated ${anim.className}`;
    }

    return '';
  }, [currentTime]);

  const activeStyles = useMemo(() => {
    if (!activeVideoClip) return {};

    const videoProps = activeVideoClip.videoProps as VideoProperties | undefined;
    const adjProps = activeVideoClip.adjustmentProps as AdjustmentProperties | undefined;

    const scale = videoProps?.scale ? videoProps.scale / 100 : 1;
    const opacity = videoProps?.opacity !== undefined ? videoProps.opacity / 100 : 1;
    const rotation = videoProps?.rotation || 0;

    const brightnessVal = adjProps?.brightness ?? 0;
    const contrastVal = adjProps?.contrast ?? 0;
    const saturationVal = adjProps?.saturation ?? 0;

    const brightness = 100 + brightnessVal;
    const contrast = 100 + contrastVal;
    const saturation = 100 + saturationVal;

    return {
      transform: `scale(${scale}) rotate(${rotation}deg)`,
      opacity: opacity,
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
      WebkitFilter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
      transition: 'transform 0.1s ease, filter 0.1s ease, opacity 0.1s ease'
    };
  }, [activeVideoClip]);

  const currentVideoVolume = useMemo(() => {
    const targetClip = activeVideoClip || clips.find(c => c.trackId === 1 || !c.trackId);
    return targetClip?.audioProps?.volume ?? 100;
  }, [activeVideoClip, clips]);

  const applyVideoVolume = useCallback((volumePercent: number) => {
    const video = videoRef.current;
    if (!video) return;

    const gainFactor = volumePercent / 100;
    const clampedVolume = Math.min(Math.max(gainFactor, 0), 1);

    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(gainFactor, audioCtxRef.current.currentTime);
    }

    video.volume = clampedVolume;
    video.muted = volumePercent === 0 || clampedVolume === 0;
  }, []);

  const setupAudioContext = useCallback(() => {
    const video = videoRef.current;
    if (!video || sourceConnectedRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const gainNode = ctx.createGain();
      const source = ctx.createMediaElementSource(video);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainNodeRef.current = gainNode;
      sourceConnectedRef.current = true;

      applyVideoVolume(currentVideoVolume);
    } catch {
      // Fallback
    }
  }, [applyVideoVolume, currentVideoVolume]);

  useEffect(() => {
    applyVideoVolume(currentVideoVolume);

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended' && isPlaying) {
      audioCtxRef.current.resume();
    }
  }, [currentVideoVolume, isPlaying, applyVideoVolume]);

  // تطبيق السرعة المطلوبة مباشرة على عنصر الفيديو
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.playbackRate !== currentVideoSpeed) {
      video.playbackRate = currentVideoSpeed;
      if ('preservesPitch' in video) {
        (video as any).preservesPitch = true;
      }
    }
  }, [currentVideoSpeed]);

  // إدارة التشغيل والإيقاف
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // המزامنة الدقيقة لـ currentTime مع أخذ trimOffset والسرعة بالاعتبار
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const validTime = isNaN(currentTime) || currentTime === null ? 0 : currentTime;
    
    let targetVideoTime = validTime;
    if (activeVideoClip) {
      const speed = currentVideoSpeed;
      const trimOffset = activeVideoClip.trimOffset || 0;
      const elapsedTimeOnTimeline = validTime - activeVideoClip.startTime;
      
      // معادلة حساب زمن الفيديو الأصلي بالدقة المطلوبة
      targetVideoTime = trimOffset + (elapsedTimeOnTimeline * speed);
    }

    const clampedTargetTime = Math.max(0, targetVideoTime);

    // ضبط موقع التشغيل داخل الفيديو عند التوقف أو حدوث فجوة زمنية
    if (!isPlaying || Math.abs(video.currentTime - clampedTargetTime) > 0.3) {
      isSeekingRef.current = true;
      video.currentTime = clampedTargetTime;
      setTimeout(() => {
        isSeekingRef.current = false;
      }, 50);
    }
  }, [currentTime, isPlaying, activeVideoClip, currentVideoSpeed]);

  const activeTextClips = useMemo(() => {
    return clips.filter(clip => {
      if (clip.trackId !== 3) return false;
      const effectiveDuration = clip.duration;
      const clipEnd = clip.startTime + effectiveDuration;
      return currentTime >= clip.startTime && currentTime <= clipEnd;
    });
  }, [clips, currentTime]);

  const handleMouseDown = useCallback((e: React.MouseEvent, clipId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = zoom / 100;

    const currentPos = textPositions[clipId] || { x: 50, y: 50 };
    const currentPixelX = (currentPos.x / 100) * (rect.width / scale);
    const currentPixelY = (currentPos.y / 100) * (rect.height / scale);

    dragOffset.current = {
      x: (e.clientX - rect.left) / scale - currentPixelX,
      y: (e.clientY - rect.top) / scale - currentPixelY
    };

    setDraggingId(clipId);
  }, [zoom, textPositions]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingId || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scale = zoom / 100;

      const unscaledWidth = rect.width / scale;
      const unscaledHeight = rect.height / scale;

      const mouseXInCanvas = (e.clientX - rect.left) / scale;
      const mouseYInCanvas = (e.clientY - rect.top) / scale;

      const newPixelX = mouseXInCanvas - dragOffset.current.x;
      const newPixelY = mouseYInCanvas - dragOffset.current.y;

      const percentX = Math.min(Math.max((newPixelX / unscaledWidth) * 100, 0), 100);
      const percentY = Math.min(Math.max((newPixelY / unscaledHeight) * 100, 0), 100);

      setInternalTextPositions(prev => ({
        ...prev,
        [draggingId]: { x: percentX, y: percentY }
      }));
    };

    const handleMouseUp = () => {
      if (draggingId) setDraggingId(null);
    };

    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, zoom]);

  const handleExportClick = () => {
    if (onExport) {
      onExport();
      return;
    }
    setIsExportModalOpen(true);
  };

  const handleAspectRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAspectRatio(e.target.value);
    setIsManualAspect(true);
  };

  const formattedAspectRatio = useMemo(() => {
    if (aspectRatio === "16:9") return "16 / 9";
    if (aspectRatio === "9:16") return "9 / 16";
    if (aspectRatio === "1:1") return "1 / 1";
    return aspectRatio;
  }, [aspectRatio]);

  const currentVideoSource = activeVideoClip?.src || videoSrc;

  return (
    <div className={styles['preview-container']}>
      <header className={styles['preview-toolbar']}>
        <div className={styles['toolbar-left']}>
          <span className={styles['preview-title']}>{projectName}</span>
          <span className={styles['preview-badge']}>معاينة</span>
        </div>

        <div className={styles['toolbar-right']}>
          <select 
            value={aspectRatio} 
            onChange={handleAspectRatioChange}
            className={styles['preview-select']}
            aria-label="اختر نسبة العرض"
          >
            <option value="16:9">16:9 (أفقي)</option>
            <option value="9:16">9:16 (عمودي)</option>
            <option value="1:1">1:1 (مربع)</option>
          </select>

          <div className={styles['preview-zoom-control']}>
            <button 
              type="button"
              onClick={() => setZoom(prev => Math.max(50, prev - 10))} 
              className={styles['preview-zoom-btn']}
              aria-label="تصغير المعاينة"
            >
              <ZoomOut size={14} aria-hidden="true" />
            </button>
            <span className={styles['preview-zoom-text']}>{zoom}%</span>
            <button 
              type="button"
              onClick={() => setZoom(prev => Math.min(200, prev + 10))} 
              className={styles['preview-zoom-btn']}
              aria-label="تكبير المعاينة"
            >
              <ZoomIn size={14} aria-hidden="true" />
            </button>
          </div>

          <button 
            type="button"
            onClick={handleExportClick} 
            className={styles['preview-export-btn']}
          >
            <Download size={14} aria-hidden="true" />
            <span>تصدير</span>
          </button>
        </div>
      </header>

      <main className={styles['preview-viewport']}>
        <div 
          ref={containerRef}
          className={styles['preview-canvas-wrapper']}
          style={{ 
            '--zoom-scale': zoom / 100,
            '--aspect-ratio': formattedAspectRatio
          } as React.CSSProperties}
        >
          {currentVideoSource ? (
            <div 
              className={`${styles['video-effect-wrapper']} ${activeVideoAnimationClass}`}
              style={activeStyles}
            >
              <video
                ref={videoRef}
                src={currentVideoSource}
                crossOrigin="anonymous"
                className={styles['preview-video-element']}
                onPlay={setupAudioContext}
                onTimeUpdate={(e) => {
                  if (isSeekingRef.current) return;
                  
                  const rawTime = e.currentTarget.currentTime;
                  if (!isNaN(rawTime) && isFinite(rawTime)) {
                    const speed = currentVideoSpeed;
                    const trimOffset = activeVideoClip?.trimOffset || 0;
                    
                    // تحويل زمن الفيديو مع إخراج trimOffset
                    const timelineTime = activeVideoClip 
                      ? activeVideoClip.startTime + ((rawTime - trimOffset) / speed)
                      : rawTime;
                    
                    onTimeUpdate?.(timelineTime);
                  }
                }}
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  setupAudioContext();
                  const dur = video.duration;
                  if (!isNaN(dur) && isFinite(dur)) {
                    onDurationChange?.(dur);
                  }

                  if (!isManualAspect && video.videoWidth && video.videoHeight) {
                    const width = video.videoWidth;
                    const height = video.videoHeight;
                    const ratio = width / height;

                    if (Math.abs(ratio - (16 / 9)) < 0.1) {
                      setAspectRatio("16:9");
                    } else if (Math.abs(ratio - (9 / 16)) < 0.1) {
                      setAspectRatio("9:16");
                    } else if (Math.abs(ratio - 1) < 0.1) {
                      setAspectRatio("1:1");
                    } else {
                      setAspectRatio(`${width} / ${height}`);
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className={styles['empty-preview-placeholder']}>
              لم يتم اختيار فيديو للمعاينة
            </div>
          )}

          <div className={styles['text-overlay-layer']}>
            {activeTextClips.map((clip) => {
              const pos = textPositions[clip.id] || { x: 50, y: 50 };
              const isSelected = draggingId === clip.id;
              const textAnimClass = getTextAnimationClass(clip);

              return (
                <div 
                  key={`${clip.id}-${textAnimClass}`}
                  onMouseDown={(e) => handleMouseDown(e, clip.id)}
                  className={`${styles['text-overlay-item']} ${isSelected ? styles['selected'] : ''} ${textAnimClass}`}
                  style={{
                    '--pos-x': `${pos.x}%`,
                    '--pos-y': `${pos.y}%`
                  } as React.CSSProperties}
                >
                  {clip.name}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        videoSrc={videoSrc}
        projectName={projectName}
        clips={clips}
        textPositions={textPositions}
      />
    </div>
  );
};

export default PreviewWindow;