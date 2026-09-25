import React, { useState, useRef } from 'react';
import { Download, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { Clip } from './Timeline';
import type { AnimationPreset, VideoProperties, AudioProperties, AdjustmentProperties } from './PropertyInspector';
import styles from './ExportModal.module.css';

export interface ExportSettings {
  resolution: '720p' | '1080p' | '4K';
  aspectRatio: '16:9' | '9:16' | '1:1';
  fps: number;
  format: 'mp4' | 'webm';
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  projectName: string;
  clips: Clip[];
  textPositions: Record<string, { x: number; y: number }>;
}

const TRANSITION_DURATION = 0.8; // مدة الانتقال بالثواني

/**
 * دالة مساعدة لتوليد سلسلة فلاتر atempo الصوتية بحسب مقياس السرعة.
 */
const buildAtempoFilter = (speed: number): string => {
  if (speed === 1 || speed <= 0) return '';
  
  const filters: string[] = [];
  let currentSpeed = speed;

  while (currentSpeed > 2.0) {
    filters.push('atempo=2.0');
    currentSpeed /= 2.0;
  }
  while (currentSpeed < 0.5) {
    filters.push('atempo=0.5');
    currentSpeed /= 0.5;
  }
  filters.push(`atempo=${currentSpeed.toFixed(2)}`);

  return filters.join(',');
};

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  videoSrc,
  projectName = 'Project',
  clips = [],
  textPositions = {},
}) => {
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const [settings, setSettings] = useState<ExportSettings>({
    resolution: '1080p',
    aspectRatio: '16:9',
    fps: 30,
    format: 'mp4',
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const loadFFmpeg = async (): Promise<FFmpeg> => {
    if (ffmpegRef.current) return ffmpegRef.current;

    const ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg WASM]:', message);
    });

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const getTargetDimensions = (): { width: number; height: number } => {
    let baseHeight = 720;
    if (settings.resolution === '1080p') baseHeight = 1080;
    if (settings.resolution === '4K') baseHeight = 2160;

    if (settings.aspectRatio === '16:9') {
      return { width: Math.round((baseHeight * 16) / 9), height: baseHeight };
    } else if (settings.aspectRatio === '9:16') {
      return { width: baseHeight, height: Math.round((baseHeight * 16) / 9) };
    } else {
      return { width: baseHeight, height: baseHeight };
    }
  };

  const seekVideoToTime = (video: HTMLVideoElement, targetTime: number): Promise<void> => {
    return new Promise((resolve) => {
      if (Math.abs(video.currentTime - targetTime) < 0.01) {
        return resolve();
      }

      let timeoutId: NodeJS.Timeout;

      const onSeeked = () => {
        clearTimeout(timeoutId);
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };

      timeoutId = setTimeout(() => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      }, 300);

      video.addEventListener('seeked', onSeeked);
      video.currentTime = targetTime;
    });
  };

  const calculateAnimationTransform = (
    clip: Clip,
    frameTime: number,
    targetWidth: number,
    targetHeight: number
  ) => {
    let opacity = 1;
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let rotate = 0;

    if (!clip.animation) {
      return { opacity, scale, translateX, translateY, rotate };
    }

    const anim = clip.animation as AnimationPreset;
    const animName = (anim.className || anim.id || '').toLowerCase();
    const clipStart = clip.startTime;
    const clipEnd = clip.startTime + clip.duration;
    const timeInClip = frameTime - clipStart;
    const timeRemaining = clipEnd - frameTime;

    let progress = -1;
    let isEntry = false;

    if (anim.category === 'in' && timeInClip <= TRANSITION_DURATION) {
      progress = Math.max(0, Math.min(1, timeInClip / TRANSITION_DURATION));
      isEntry = true;
    } else if (anim.category === 'out' && timeRemaining <= TRANSITION_DURATION) {
      progress = Math.max(0, Math.min(1, timeRemaining / TRANSITION_DURATION));
      isEntry = false;
    } else if (anim.category === 'combo') {
      progress = Math.max(0, Math.min(1, timeInClip / clip.duration));
      isEntry = true;
    }

    if (progress === -1) {
      return { opacity, scale, translateX, translateY, rotate };
    }

    if (animName.includes('fadein')) {
      opacity = progress;
    } else if (animName.includes('fadeout')) {
      opacity = progress;
    } else if (animName.includes('zoomin')) {
      opacity = progress;
      scale = isEntry ? 0.3 + 0.7 * progress : 1 + 0.3 * (1 - progress);
    } else if (animName.includes('zoomout')) {
      opacity = progress;
      scale = isEntry ? 1.5 - 0.5 * progress : 0.5 + 0.5 * progress;
    } else if (animName.includes('slideinleft') || animName.includes('backinleft')) {
      opacity = progress;
      translateX = isEntry ? -targetWidth * (1 - progress) : -targetWidth * (1 - progress);
    } else if (animName.includes('slideinright') || animName.includes('backinright')) {
      opacity = progress;
      translateX = isEntry ? targetWidth * (1 - progress) : targetWidth * (1 - progress);
    } else if (animName.includes('slideintop') || animName.includes('backintop')) {
      opacity = progress;
      translateY = isEntry ? -targetHeight * (1 - progress) : -targetHeight * (1 - progress);
    } else if (animName.includes('slideinbottom') || animName.includes('backinbottom')) {
      opacity = progress;
      translateY = isEntry ? targetHeight * (1 - progress) : targetHeight * (1 - progress);
    } else if (animName.includes('bounce')) {
      opacity = progress;
      scale = 1 + Math.sin(progress * Math.PI * 2) * 0.15;
    } else if (animName.includes('rotate') || animName.includes('spin')) {
      opacity = progress;
      rotate = (1 - progress) * (isEntry ? -360 : 360);
    } else {
      opacity = progress;
    }

    return { opacity, scale, translateX, translateY, rotate };
  };

  const startExportProcess = async () => {
    let createdFramesCount = 0;
    let hasMainVideoAudio = false;
    let currentInputIndex = 0;

    try {
      setIsExporting(true);
      setIsCompleted(false);
      setErrorMessage(null);
      setExportProgress(0);
      setStatusMessage('جاري تحميل محرك FFmpeg WASM...');

      const ffmpeg = await loadFFmpeg();
      const { width: targetWidth, height: targetHeight } = getTargetDimensions();

      setStatusMessage('تهيئة بيئة الرندر وCanvas...');
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('تعذر إنشاء سياق الرسم Canvas Context');

      const offscreenVideo = document.createElement('video');
      offscreenVideo.src = videoSrc;
      offscreenVideo.crossOrigin = 'anonymous';
      offscreenVideo.muted = true;
      offscreenVideo.preload = 'auto';

      await new Promise((resolve, reject) => {
        offscreenVideo.onloadeddata = resolve;
        offscreenVideo.onerror = () => reject(new Error('فشل تحميل مصدر الفيديو الأساسي.'));
      });

      // 1. حساب أبعد نقطة نهاية للمقاطع في التايم لاين بشكل دقيق
      const maxClipEnd = clips.reduce((max, clip) => {
        const clipEnd = clip.startTime + clip.duration;
        return clipEnd > max ? clipEnd : max;
      }, 0);

      // اعتماد طول المقاطع إذا وجدت، وإلا استخدام طول الفيديو الأصلي
      const timelineDuration = maxClipEnd > 0 ? maxClipEnd : (offscreenVideo.duration || 0);

      const fps = settings.fps;
      // Math.ceil لتغطية كسور الثواني
      const totalFrames = Math.max(1, Math.ceil(timelineDuration * fps));
      createdFramesCount = totalFrames;

      setStatusMessage('جاري رندر الإطارات المقصوصة وتطبيق الأنيميشن والفلاتر...');

      for (let i = 0; i < totalFrames; i++) {
        const frameTime = (i + 0.001) / fps;

        // 2. تنظيف الـ Canvas ورسم خلفية سوداء ناصعة لكل إطار
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.restore();

        // البحث عن مقطع الفيديو النشط في هذه اللحظة الزمنية
        const activeVideoClip = clips.find((clip) => {
          const isVideoTrack = clip.trackId === 1 || !clip.trackId;
          const clipEnd = clip.startTime + clip.duration;
          return isVideoTrack && frameTime >= clip.startTime && frameTime < clipEnd;
        });

        if (activeVideoClip) {
          const speed = activeVideoClip.speedProps?.speed ?? activeVideoClip.speed ?? 1.0;
          const trimOffset = activeVideoClip.trimOffset || 0;
          const elapsedTimeInClip = frameTime - activeVideoClip.startTime;

          // حساب الوقت الدقيق من مصدر الفيديو الأصلي بعد دمج القص والسرعة
          const sourceVideoTime = trimOffset + (elapsedTimeInClip * speed);
          const clampedVideoTime = Math.min(
            Math.max(0, sourceVideoTime),
            Math.max(0, (offscreenVideo.duration || 0) - 0.05)
          );

          await seekVideoToTime(offscreenVideo, clampedVideoTime);

          const videoProps = activeVideoClip.videoProps as VideoProperties | undefined;
          const adjProps = activeVideoClip.adjustmentProps as AdjustmentProperties | undefined;

          const animTransform = calculateAnimationTransform(activeVideoClip, frameTime, targetWidth, targetHeight);

          const baseScale = videoProps?.scale ? videoProps.scale / 100 : 1;
          const userRotation = videoProps?.rotation || 0;
          const userOpacity = videoProps?.opacity !== undefined ? videoProps.opacity / 100 : 1;

          const finalScale = baseScale * animTransform.scale;
          const finalOpacity = Math.max(0, Math.min(1, userOpacity * animTransform.opacity));
          const finalRotation = userRotation + animTransform.rotate;

          const brightnessVal = 100 + (adjProps?.brightness ?? 0);
          const contrastVal = 100 + (adjProps?.contrast ?? 0);
          const saturationVal = 100 + (adjProps?.saturation ?? 0);

          ctx.save();
          ctx.globalAlpha = finalOpacity;
          ctx.filter = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturationVal}%)`;

          const centerX = targetWidth / 2 + animTransform.translateX;
          const centerY = targetHeight / 2 + animTransform.translateY;

          ctx.translate(centerX, centerY);
          ctx.rotate((finalRotation * Math.PI) / 180);
          ctx.scale(finalScale, finalScale);

          ctx.drawImage(
            offscreenVideo,
            -targetWidth / 2,
            -targetHeight / 2,
            targetWidth,
            targetHeight
          );

          ctx.restore();
        }

        // رسم النصوص النشطة
        const activeTextClips = clips.filter((clip) => {
          if (clip.trackId !== 3) return false;
          return frameTime >= clip.startTime && frameTime < clip.startTime + clip.duration;
        });

        activeTextClips.forEach((clip) => {
          const pos = textPositions[clip.id] || { x: 50, y: 50 };
          const posX = (pos.x / 100) * targetWidth;
          const posY = (pos.y / 100) * targetHeight;

          const textAnim = calculateAnimationTransform(clip, frameTime, targetWidth, targetHeight);

          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, textAnim.opacity));

          ctx.translate(posX + textAnim.translateX, posY + textAnim.translateY);
          ctx.rotate((textAnim.rotate * Math.PI) / 180);
          ctx.scale(textAnim.scale, textAnim.scale);

          const fontSize = Math.round(targetHeight * 0.05);
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const textMetrics = ctx.measureText(clip.name);
          const paddingX = fontSize * 0.5;
          const textWidth = textMetrics.width + paddingX * 2;
          const textHeight = fontSize * 1.4;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(-textWidth / 2, -textHeight / 2, textWidth, textHeight, fontSize * 0.2);
          } else {
            ctx.rect(-textWidth / 2, -textHeight / 2, textWidth, textHeight);
          }
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillText(clip.name, 0, 0);
          ctx.restore();
        });

        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
        if (blob) {
          const frameData = await fetchFile(blob);
          const frameName = `frame_${String(i).padStart(5, '0')}.jpg`;
          await ffmpeg.writeFile(frameName, frameData);
        }

        const progressPercent = Math.round(((i + 1) / totalFrames) * 50);
        setExportProgress(progressPercent);
      }

      setStatusMessage('معالجة ومزامنة المسارات الصوتية المقصوصة والسرعات...');
      const audioArgs: string[] = [];
      const filterInputs: string[] = [];
      const filterComplexParts: string[] = [];

      // معالجة الصوت الخاص بجميع مقاطع الفيديو على المسار الأول
      const videoClips = clips.filter((c) => c.trackId === 1 || !c.trackId);

      if (videoClips.length > 0) {
        try {
          const videoAudioData = await fetchFile(videoSrc);
          await ffmpeg.writeFile('main_video.mp4', videoAudioData);

          for (let idx = 0; idx < videoClips.length; idx++) {
            const vClip = videoClips[idx];
            audioArgs.push('-i', 'main_video.mp4');

            const audioInputIndex = currentInputIndex + 1;
            currentInputIndex++;

            const trimStart = (vClip.trimOffset || 0).toFixed(2);
            const speed = vClip.speedProps?.speed ?? vClip.speed ?? 1.0;
            const originalDurationNeeded = (vClip.duration * speed).toFixed(2);

            const vAudioProps = vClip.audioProps as AudioProperties | undefined;
            const volume = vAudioProps?.volume !== undefined ? (vAudioProps.volume / 100).toFixed(2) : '1.00';
            const delayMs = Math.round(vClip.startTime * 1000);

            let filter = `atrim=start=${trimStart}:duration=${originalDurationNeeded},asetpts=PTS-STARTPTS,volume=${volume}`;
            const atempo = buildAtempoFilter(speed);
            if (atempo) filter += `,${atempo}`;
            filter += `,adelay=${delayMs}|${delayMs}`;

            filterComplexParts.push(`[${audioInputIndex}:a]${filter}[va${idx}]`);
            filterInputs.push(`[va${idx}]`);
          }
          hasMainVideoAudio = true;
        } catch {
          console.warn('تعذر استخراج الصوت من الفيديو الأساسي.');
        }
      }

      // معالجة مقاطع الصوت في المسار الثاني (Track 2)
      const exportAudioClips = clips.filter((c) => c.trackId === 2 && c.src);
      for (let idx = 0; idx < exportAudioClips.length; idx++) {
        const audioClip = exportAudioClips[idx];
        if (!audioClip.src) continue;

        const audioData = await fetchFile(audioClip.src);
        const fileName = `audio_${idx}.mp3`;
        await ffmpeg.writeFile(fileName, audioData);

        audioArgs.push('-i', fileName);
        const audioInputIndex = currentInputIndex + 1;
        currentInputIndex++;

        const trimStart = (audioClip.trimOffset || 0).toFixed(2);
        const speed = audioClip.speed || 1.0;
        const originalDurationNeeded = (audioClip.duration * speed).toFixed(2);

        const delayMs = Math.round(audioClip.startTime * 1000);
        const clipAudioProps = audioClip.audioProps as AudioProperties | undefined;
        const clipVolume = clipAudioProps?.volume !== undefined ? (clipAudioProps.volume / 100).toFixed(2) : '1.00';

        let filter = `atrim=start=${trimStart}:duration=${originalDurationNeeded},asetpts=PTS-STARTPTS,volume=${clipVolume}`;
        const clipAtempo = buildAtempoFilter(speed);
        if (clipAtempo) filter += `,${clipAtempo}`;
        filter += `,adelay=${delayMs}|${delayMs}`;

        filterComplexParts.push(`[${audioInputIndex}:a]${filter}[track2_a${idx}]`);
        filterInputs.push(`[track2_a${idx}]`);
      }

      // دمج فلتر الصوت الإجمالي
      let filterComplexStr = '';
      if (filterInputs.length > 0) {
        if (filterInputs.length === 1) {
          filterComplexStr = `${filterComplexParts.join(';')};${filterInputs[0]}aresample=async=1[aout]`;
        } else {
          filterComplexStr = `${filterComplexParts.join(';')};${filterInputs.join('')}amix=inputs=${filterInputs.length}:duration=longest:dropout_transition=2:normalize=0[aout]`;
        }
      }

      setStatusMessage('ترميز الملف النهائي وكتابة الفيديو...');
      const outputFileName = `output.${settings.format}`;
      const ffmpegCmd = ['-framerate', `${fps}`, '-i', 'frame_%05d.jpg', ...audioArgs];

      if (filterComplexStr) {
        ffmpegCmd.push('-filter_complex', filterComplexStr, '-map', '0:v', '-map', '[aout]');
      } else {
        ffmpegCmd.push('-map', '0:v');
      }

      const encoder = settings.format === 'mp4' ? 'libx264' : 'libvpx-vp9';

      ffmpegCmd.push(
        '-c:v',
        encoder,
        '-preset',
        'ultrafast',
        '-c:a',
        'aac',
        '-pix_fmt',
        'yuv420p',
        outputFileName
      );

      setExportProgress(75);
      await ffmpeg.exec(ffmpegCmd);
      setExportProgress(90);

      setStatusMessage('تحضير الملف للتنزيل...');
      const data = await ffmpeg.readFile(outputFileName);
      const mimeType = settings.format === 'mp4' ? 'video/mp4' : 'video/webm';
      const videoBlob = new Blob([data as Uint8Array], { type: mimeType });
      const downloadUrl = URL.createObjectURL(videoBlob);

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = downloadUrl;
      downloadAnchor.download = `${projectName.replace(/\s+/g, '_')}_rendered.${settings.format}`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(downloadUrl);

      setStatusMessage('تنظيف الذاكرة المؤقتة...');
      for (let i = 0; i < createdFramesCount; i++) {
        await ffmpeg.deleteFile(`frame_${String(i).padStart(5, '0')}.jpg`).catch(() => {});
      }
      if (hasMainVideoAudio) {
        await ffmpeg.deleteFile('main_video.mp4').catch(() => {});
      }
      for (let i = 0; i < exportAudioClips.length; i++) {
        await ffmpeg.deleteFile(`audio_${i}.mp3`).catch(() => {});
      }
      await ffmpeg.deleteFile(outputFileName).catch(() => {});

      setExportProgress(100);
      setIsCompleted(true);
      setStatusMessage('تم التصدير بنجاح!');
    } catch (err: any) {
      console.error('خطأ أثناء عملية التصدير:', err);
      setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء المعالجة والتصدير.');

      if (ffmpegRef.current) {
        for (let i = 0; i < createdFramesCount; i++) {
          ffmpegRef.current.deleteFile(`frame_${String(i).padStart(5, '0')}.jpg`).catch(() => {});
        }
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div 
      className={styles.exportModalOverlay} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="export-modal-title"
    >
      <div className={styles.exportModalCard}>
        <header className={styles.exportModalHeader}>
          <div className={styles.exportHeaderTitle}>
            <div className={styles.headerLogo}>
              <div className={styles.logoIcon}>
                <svg width="28" height="24" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
            <h2 id="export-modal-title">تصدير المشروع</h2>
          </div>
          <button 
            type="button" 
            className={styles.exportCloseBtn} 
            onClick={onClose} 
            disabled={isExporting}
            aria-label="إغلاق النافذة"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <main className={styles.exportModalBody}>
          {!isExporting && !isCompleted && (
            <form onSubmit={(e) => e.preventDefault()} className={styles.exportSettingsGrid}>
              <div className={styles.exportField}>
                <label htmlFor="export-resolution">الجودة (Resolution)</label>
                <select
                  id="export-resolution"
                  value={settings.resolution}
                  onChange={(e) => setSettings({ ...settings, resolution: e.target.value as any })}
                >
                  <option value="720p">720p (HD)</option>
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="4K">4K (Ultra HD)</option>
                </select>
              </div>

              <div className={styles.exportField}>
                <label htmlFor="export-aspect-ratio">نسبة العرض (Aspect Ratio)</label>
                <select
                  id="export-aspect-ratio"
                  value={settings.aspectRatio}
                  onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value as any })}
                >
                  <option value="16:9">16:9 (أفقي - YouTube)</option>
                  <option value="9:16">9:16 (عمودي - Reels/TikTok)</option>
                  <option value="1:1">1:1 (مربع - Instagram)</option>
                </select>
              </div>

              <div className={styles.exportField}>
                <label htmlFor="export-fps">معدل الإطارات (FPS)</label>
                <select
                  id="export-fps"
                  value={settings.fps}
                  onChange={(e) => setSettings({ ...settings, fps: Number(e.target.value) })}
                >
                  <option value={24}>24 FPS (Cinematic)</option>
                  <option value={30}>30 FPS (Standard)</option>
                  <option value={60}>60 FPS (Smooth)</option>
                </select>
              </div>

              <div className={styles.exportField}>
                <label htmlFor="export-format">الصيغة (Format)</label>
                <select
                  id="export-format"
                  value={settings.format}
                  onChange={(e) => setSettings({ ...settings, format: e.target.value as any })}
                >
                  <option value="mp4">MP4 (H.264)</option>
                  <option value="webm">WebM (VP9)</option>
                </select>
              </div>
            </form>
          )}

          {isExporting && (
            <div className={styles.exportStatusContainer} aria-live="polite">
              <Loader2 className={styles.exportSpinner} size={40} aria-hidden="true" />
              <div 
                className={styles.exportProgressBarWrapper} 
                role="progressbar" 
                aria-valuenow={exportProgress} 
                aria-valuemin={0} 
                aria-valuemax={100}
              >
                <div className={styles.exportProgressBar} style={{ width: `${exportProgress}%` }} />
              </div>
              <p className={styles.exportProgressText}>{exportProgress}%</p>
              <p className={styles.exportStatusSubtext}>{statusMessage}</p>
            </div>
          )}

          {isCompleted && (
            <div className={styles.exportCompletedContainer} role="status">
              <CheckCircle2 size={48} className={styles.successIcon} aria-hidden="true" />
              <h3>تم تصدير الفيديو بنجاح!</h3>
              <p>بدأ تحميل الملف تلقائيًا إلى جهازك.</p>
            </div>
          )}

          {errorMessage && (
            <div className={styles.exportErrorContainer} role="alert">
              <AlertCircle size={32} className={styles.errorIcon} aria-hidden="true" />
              <p>{errorMessage}</p>
            </div>
          )}
        </main>

        <footer className={styles.exportModalFooter}>
          {isCompleted ? (
            <button type="button" className={styles.btnPrimary} onClick={onClose}>
              إغلاق
            </button>
          ) : (
            <>
              <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={isExporting}>
                إلغاء
              </button>
              <button type="button" className={styles.btnPrimary} onClick={startExportProcess} disabled={isExporting}>
                <Download size={16} aria-hidden="true" />
                <span>{isExporting ? 'جاري الرندر...' : 'بدء التصدير'}</span>
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
};

export default ExportModal;