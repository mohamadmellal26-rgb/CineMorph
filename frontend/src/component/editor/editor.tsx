import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./editor.module.css";
import Timeline from "./Timeline";
import type { Clip } from "./Timeline";
import { PreviewWindow } from "./PreviewWindow";
import PropertyInspector, { 
  type VideoProperties, 
  type AudioProperties,
  type SpeedProperties, 
  type AnimationPreset, 
  type AdjustmentProperties 
} from './PropertyInspector';
import { Upload, ArrowLeft } from "lucide-react";

export default function EditorApp() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // إدارة الكليبات والكليب المحدد حالياً
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // حالات المزامنة والتشغيل
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // المرجع للكليب المحدد حالياً
  const selectedClip = useMemo(() => {
    if (!selectedClipId) return null;
    return clips.find((c) => c.id === selectedClipId) || null;
  }, [clips, selectedClipId]);

  // تنظيف الـ ObjectURL من الذاكرة
  useEffect(() => {
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  // معالجة رفع الفيديو وإنشاء كليب رئيسي بشكل تلقائي
  const processVideoFile = useCallback((file: File) => {
    if (file && file.type.startsWith("video/")) {
      const newUrl = URL.createObjectURL(file);
      const defaultId = `clip-main-${Date.now()}`;
      
      setVideoSrc(newUrl);
      setVideoName(file.name);
      setCurrentTime(0);
      setIsPlaying(false);

      // إنشاء الكليب الرئيسي بالفيديو فوراً لربط السرعة وجميع الخصائص به
      const initialClip: Clip = {
        id: defaultId,
        name: file.name,
        src: newUrl,
        startTime: 0,
        duration: 0, // سيتم تحديثها فور تحميل Metadata
        trackId: 1,
        speed: 1.0,
        speedProps: { speed: 1.0, smoothSlowMo: false },
        videoProps: { scale: 100, opacity: 100, rotation: 0, positionX: 0, positionY: 0 },
        audioProps: { volume: 100 },
        adjustmentProps: { brightness: 0, contrast: 0, saturation: 0 },
        animation: null
      };

      setClips([initialClip]);
      setSelectedClipId(defaultId);
    } else {
      alert("Please select a valid video file (MP4, WEBM, MOV, ...)");
    }
  }, []);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  // معالجة تحديث الطول الزمني الإجمالي وتحديث طول الكليب الرئيسي
  const handleDurationChange = useCallback((newDuration: number) => {
    setDuration(newDuration);
    setClips(prevClips => {
      if (prevClips.length === 0) return prevClips;
      return prevClips.map(clip => {
        if (clip.trackId === 1 && clip.duration === 0) {
          return { ...clip, duration: newDuration };
        }
        return clip;
      });
    });
  }, []);

  // أحداث السحب والإفلات (Drag and Drop)
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processVideoFile(files[0]);
    }
  };

  // إعادة ضبط المحرر
  const handleReset = () => {
    setVideoSrc(null);
    setVideoName("");
    setCurrentTime(0);
    setIsPlaying(false);
    setClips([]);
    setSelectedClipId(null);
  };

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // تحديث خصائص الكليب المحدد في مصفوفة clips الرئيسية
  const updateSelectedClipProps = useCallback(
    (updater: (clip: Clip) => Clip) => {
      setClips((prevClips) => {
        const targetId = selectedClipId || (prevClips[0] ? prevClips[0].id : null);
        if (!targetId) return prevClips;
        return prevClips.map((c) => (c.id === targetId ? updater(c) : c));
      });
    },
    [selectedClipId]
  );

  // Callbacks الخاصة بـ PropertyInspector
  const handleVideoPropsChange = useCallback((newProps: VideoProperties) => {
    updateSelectedClipProps((clip) => ({ ...clip, videoProps: newProps }));
  }, [updateSelectedClipProps]);

  const handleAudioPropsChange = useCallback((newProps: AudioProperties) => {
    updateSelectedClipProps((clip) => ({ ...clip, audioProps: newProps }));
  }, [updateSelectedClipProps]);

  // تحديث السرعة المزدوج (speed + speedProps) لضمان العمل في PreviewWindow و Timeline
  const handleSpeedPropsChange = useCallback((newProps: SpeedProperties) => {
    updateSelectedClipProps((clip) => ({ 
      ...clip, 
      speed: newProps.speed,
      speedProps: newProps 
    }));
  }, [updateSelectedClipProps]);

  const handleAnimationSelect = useCallback((anim: AnimationPreset | null) => {
    updateSelectedClipProps((clip) => ({ ...clip, animation: anim }));
  }, [updateSelectedClipProps]);

  const handleAdjustmentChange = useCallback((newProps: AdjustmentProperties) => {
    updateSelectedClipProps((clip) => ({ ...clip, adjustmentProps: newProps }));
  }, [updateSelectedClipProps]);

  // التحكم بـ Spacebar للتشغيل والإيقاف
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)
      ) {
        return;
      }

      if (e.code === "Space" && videoSrc) {
        e.preventDefault();
        handleTogglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTogglePlay, videoSrc]);

  // 1. شاشة الرفع
  if (!videoSrc) {
    return (
      <div className={styles.uploadPage}>
        <Link to="/" className={styles.headerLink}>
          <header className={styles.appHeaderSimple}>
            <div className={styles.headerLogo}>
              <div className={styles.logoIcon}>
                <svg width="28" height="24" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 3C2.34315 3 1 4.34315 1 6V18C1 19.6569 2.34315 21 4 21H24C25.6569 21 27 19.6569 27 18V6C27 4.34315 25.6569 3 24 3H4Z" fill="url(#paint0_linear)"/>
                  <path d="M1 9H27M1 15H27" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
                  <defs>
                    <linearGradient id="paint0_linear" x1="1" y1="3" x2="27" y2="21" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#8A2BE2"/>
                      <stop offset="0.5" stopColor="#9933FF"/>
                      <stop offset="1" stopColor="#00C4CC"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className={styles.logoText}>CineMorph</span>
            </div>
          </header>
        </Link>

        <div
          className={`${styles.uploadCard} ${isDragging ? styles.dragging : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <h2>Add Video to Editor</h2>
          <p>Drag and drop your video file here, or click to select from your device</p>

          <label htmlFor="video-input" className={styles.uploadBtn}>
            <Upload size={18} />
            <span>Select Video</span>
          </label>
          <input
            id="video-input"
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className={styles.fileInputHidden}
          />
        </div>
      </div>
    );
  }

  // 2. بيئة العمل الرئيسية
  return (
    <div className={styles.editorPage}>
      <header className={styles.editorHeader}>
        <div className={styles.editorHeaderLeft}>
          <button onClick={handleReset} className={styles.backBtn} title="Change Video">
            <ArrowLeft size={16} />
            <span>New Video</span>
          </button>
        </div>

        <h1 className={styles.projectTitleHeader}>{videoName || "Workspace"}</h1>
      </header>

      <div className={styles.editorContent}>
        {/* المنطقة الرئيسية: المعاينة + الخط الزمني */}
        <div className={styles.mainWorkspace}>
          <div className={styles.previewSection}>
            <PreviewWindow
              videoSrc={videoSrc}
              projectName={videoName}
              currentTime={currentTime}
              isPlaying={isPlaying}
              clips={clips}
              onTimeUpdate={setCurrentTime}
              onDurationChange={handleDurationChange}
            />
          </div>

          <div className={styles.timelineSection}>
            <Timeline
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              clips={clips}
              selectedClipId={selectedClipId}
              onTogglePlay={handleTogglePlay}
              onSeek={setCurrentTime}
              onClipsChange={setClips}
              onSelectClip={setSelectedClipId}
            />
          </div>
        </div>

        {/* شريط الخصائص الأيمن */}
        <aside className={styles.inspectorSidebar}>
          <PropertyInspector
            key={selectedClipId || 'defaultClip'}
            selectedClipId={selectedClipId || undefined}
            selectedClipName={selectedClip?.name || videoName}
            initialVideoProps={selectedClip?.videoProps}
            initialAudioProps={selectedClip?.audioProps}
            initialSpeedProps={selectedClip?.speedProps || { speed: selectedClip?.speed || 1.0 }}
            initialAnimation={selectedClip?.animation}
            initialAdjustmentProps={selectedClip?.adjustmentProps}
            onVideoPropsChange={handleVideoPropsChange}
            onAudioPropsChange={handleAudioPropsChange}
            onSpeedPropsChange={handleSpeedPropsChange}
            onAnimationSelect={handleAnimationSelect}
            onAdjustmentChange={handleAdjustmentChange}
          />
        </aside>
      </div>
    </div>
  );
}