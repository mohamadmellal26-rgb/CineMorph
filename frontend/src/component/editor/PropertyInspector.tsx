import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import 'animate.css';
import { 
  FiVideo, 
  FiZap, 
  FiFilm, 
  FiSliders, 
  FiDownloadCloud, 
  FiEyeOff,
  FiMusic,
  FiVolume2,
  FiType
} from 'react-icons/fi';
import styles from './PropertyInspector.module.css';

export type ClipType = 'video' | 'audio' | 'image' | 'text';
export type TabType = 'text' | 'video' | 'audio' | 'speed' | 'animation' | 'adjustment';
export type AnimCategory = 'in' | 'out' | 'combo';

export interface AnimationPreset {
  id: string;
  name: string;
  category: AnimCategory;
  className: string;
  downloaded: boolean;
}

export interface VideoProperties {
  scale: number;
  opacity: number;
  rotation: number;
  positionX: number;
  positionY: number;
}

export interface AudioProperties {
  volume: number;
}

export interface SpeedProperties {
  speed: number;
  smoothSlowMo: boolean;
}

export interface AdjustmentProperties {
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface TextProperties {
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
}

export interface PropertyInspectorProps {
  selectedClipId?: string;
  selectedClipName?: string;
  clipType?: ClipType;
  initialVideoProps?: VideoProperties;
  initialAudioProps?: AudioProperties;
  initialSpeedProps?: SpeedProperties;
  initialAnimation?: AnimationPreset | null;
  initialAdjustmentProps?: AdjustmentProperties;
  initialTextProps?: TextProperties;

  // Callback Functions
  onVideoPropsChange?: (props: VideoProperties) => void;
  onAudioPropsChange?: (props: AudioProperties) => void;
  onSpeedPropsChange?: (props: SpeedProperties) => void;
  onAnimationSelect?: (anim: AnimationPreset | null) => void;
  onAdjustmentChange?: (props: AdjustmentProperties) => void;
  onTextPropsChange?: (props: TextProperties) => void;
}

const DEFAULT_VIDEO_PROPS: VideoProperties = {
  scale: 100,
  opacity: 100,
  rotation: 0,
  positionX: 0,
  positionY: 0,
};

const DEFAULT_AUDIO_PROPS: AudioProperties = {
  volume: 100,
};

const DEFAULT_SPEED_PROPS: SpeedProperties = {
  speed: 1.0,
  smoothSlowMo: false,
};

const DEFAULT_ADJ_PROPS: AdjustmentProperties = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
};

const DEFAULT_TEXT_PROPS: TextProperties = {
  text: 'نص جديد',
  fontSize: 24,
  color: '#ffffff',
  fontFamily: 'Arial',
};

const ANIMATION_PRESETS: AnimationPreset[] = [
  { id: 'none', name: 'None', category: 'in', className: '', downloaded: true },
  { id: 'fade_in', name: 'Fade In', category: 'in', className: 'animate__fadeIn', downloaded: true },
  { id: 'zoom_in', name: 'Zoom In', category: 'in', className: 'animate__zoomIn', downloaded: true },
  { id: 'slide_down', name: 'Slide Down', category: 'in', className: 'animate__slideInDown', downloaded: true },
  { id: 'bounce_in', name: 'Bounce In', category: 'in', className: 'animate__bounceIn', downloaded: true },
  { id: 'spin_in', name: 'Rotate In', category: 'in', className: 'animate__rotateIn', downloaded: true },

  { id: 'fade_out', name: 'Fade Out', category: 'out', className: 'animate__fadeOut', downloaded: true },
  { id: 'zoom_out', name: 'Zoom Out', category: 'out', className: 'animate__zoomOut', downloaded: true },
  { id: 'slide_up', name: 'Slide Up', category: 'out', className: 'animate__slideOutUp', downloaded: true },
  { id: 'bounce_out', name: 'Bounce Out', category: 'out', className: 'animate__bounceOut', downloaded: true },

  { id: 'shake_1', name: 'Shake', category: 'combo', className: 'animate__shakeX', downloaded: true },
  { id: 'shake_2', name: 'Pulse', category: 'combo', className: 'animate__pulse', downloaded: true },
  { id: 'swing', name: 'Swing', category: 'combo', className: 'animate__swing', downloaded: true },
  { id: 'tada', name: 'Tada', category: 'combo', className: 'animate__tada', downloaded: true },
];

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  selectedClipId,
  selectedClipName,
  clipType,
  initialVideoProps,
  initialAudioProps,
  initialSpeedProps,
  initialAnimation,
  initialAdjustmentProps,
  initialTextProps,
  onVideoPropsChange,
  onAudioPropsChange,
  onSpeedPropsChange,
  onAnimationSelect,
  onAdjustmentChange,
  onTextPropsChange,
}) => {
  const resolvedClipType = useMemo<ClipType>(() => {
    if (clipType) return clipType;
    if (selectedClipName) {
      const lowerName = selectedClipName.toLowerCase();
      // التفتيش التلقائي عن كلمة "نص" أو "text" في الاسم
      if (lowerName.includes('text') || lowerName.includes('نص')) {
        return 'text';
      }
      if (lowerName.endsWith('.mp3') || lowerName.endsWith('.wav') || lowerName.endsWith('.aac') || lowerName.endsWith('.ogg') || lowerName.endsWith('.m4a')) {
        return 'audio';
      }
    }
    return 'video';
  }, [clipType, selectedClipName]);

  const availableTabs = useMemo<TabType[]>(() => {
    if (resolvedClipType === 'audio') {
      return ['audio', 'speed'];
    }
    if (resolvedClipType === 'text') {
      return ['animation']; // إظهار التبويب الخاص بالانميشن فقط للـ Text
    }
    return ['video', 'audio', 'speed', 'animation', 'adjustment'];
  }, [resolvedClipType]);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (resolvedClipType === 'audio') return 'audio';
    if (resolvedClipType === 'text') return 'animation';
    return 'video';
  });

  const [animCategory, setAnimCategory] = useState<AnimCategory>('in');
  const [selectedAnimId, setSelectedAnimId] = useState<string>('none');

  const [videoProps, setVideoProps] = useState<VideoProperties>(initialVideoProps || DEFAULT_VIDEO_PROPS);
  const [audioProps, setAudioProps] = useState<AudioProperties>(initialAudioProps || DEFAULT_AUDIO_PROPS);
  const [speedProps, setSpeedProps] = useState<SpeedProperties>(initialSpeedProps || DEFAULT_SPEED_PROPS);
  const [adjProps, setAdjProps] = useState<AdjustmentProperties>(initialAdjustmentProps || DEFAULT_ADJ_PROPS);
  const [textProps, setTextProps] = useState<TextProperties>(initialTextProps || DEFAULT_TEXT_PROPS);

  const prevClipIdRef = useRef<string | undefined>(selectedClipId);

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [availableTabs, activeTab]);

  useEffect(() => {
    if (selectedClipId !== prevClipIdRef.current) {
      prevClipIdRef.current = selectedClipId;
      setVideoProps(initialVideoProps || DEFAULT_VIDEO_PROPS);
      setAudioProps(initialAudioProps || DEFAULT_AUDIO_PROPS);
      setSpeedProps(initialSpeedProps || DEFAULT_SPEED_PROPS);
      setAdjProps(initialAdjustmentProps || DEFAULT_ADJ_PROPS);
      setTextProps(initialTextProps || DEFAULT_TEXT_PROPS);

      if (initialAnimation) {
        setSelectedAnimId(initialAnimation.id);
        setAnimCategory(initialAnimation.category);
      } else {
        setSelectedAnimId('none');
      }

      if (resolvedClipType === 'audio') {
        setActiveTab('audio');
      } else if (resolvedClipType === 'text') {
        setActiveTab('animation');
      }
    }
  }, [
    selectedClipId, 
    initialVideoProps, 
    initialAudioProps, 
    initialSpeedProps, 
    initialAdjustmentProps, 
    initialAnimation, 
    initialTextProps,
    resolvedClipType
  ]);

  useEffect(() => {
    if (initialAudioProps?.volume !== undefined) {
      setAudioProps(prev => prev.volume !== initialAudioProps.volume ? initialAudioProps : prev);
    }
  }, [initialAudioProps?.volume]);

  const handleVideoChange = useCallback((key: keyof VideoProperties, val: number) => {
    setVideoProps((prev) => {
      const updated = { ...prev, [key]: val };
      onVideoPropsChange?.(updated);
      return updated;
    });
  }, [onVideoPropsChange]);

  const handleAudioChange = useCallback((key: keyof AudioProperties, val: number) => {
    setAudioProps((prev) => {
      const updated = { ...prev, [key]: val };
      onAudioPropsChange?.(updated);
      return updated;
    });
  }, [onAudioPropsChange]);

  const handleSpeedChange = useCallback((val: number) => {
    setSpeedProps((prev) => {
      const updated = { ...prev, speed: val };
      onSpeedPropsChange?.(updated);
      return updated;
    });
  }, [onSpeedPropsChange]);

  const handleAdjChange = useCallback((key: keyof AdjustmentProperties, val: number) => {
    setAdjProps((prev) => {
      const updated = { ...prev, [key]: val };
      onAdjustmentChange?.(updated);
      return updated;
    });
  }, [onAdjustmentChange]);

  const handleTextChange = useCallback((key: keyof TextProperties, val: string | number) => {
    setTextProps((prev) => {
      const updated = { ...prev, [key]: val };
      onTextPropsChange?.(updated);
      return updated;
    });
  }, [onTextPropsChange]);

  const handleSelectAnimation = useCallback((anim: AnimationPreset) => {
    setSelectedAnimId(anim.id);
    if (anim.id === 'none') {
      onAnimationSelect?.(null);
    } else {
      onAnimationSelect?.(anim);
    }
  }, [onAnimationSelect]);

  const filteredPresets = ANIMATION_PRESETS.filter(
    (p) => p.category === animCategory || p.id === 'none'
  );

  if (!selectedClipId) {
    return (
      <div className={styles['inspector-container']} dir="ltr">
        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
          No clip selected
        </div>
      </div>
    );
  }

  return (
    <div className={styles['inspector-container']} dir="ltr">
      {selectedClipName && (
        <div style={{ padding: '8px 12px', fontSize: '12px', opacity: 0.7, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {resolvedClipType === 'audio' ? (
            <FiMusic size={12} />
          ) : resolvedClipType === 'text' ? (
            <FiType size={12} />
          ) : (
            <FiVideo size={12} />
          )}
          <span>Clip: {selectedClipName}</span>
        </div>
      )}

      {/* TABS HEADER */}
      <div className={styles['tabs-header']}>
        {availableTabs.includes('text') && (
          <button
            type="button"
            className={`${styles['tab-btn']} ${activeTab === 'text' ? styles['active'] : ''}`}
            onClick={() => setActiveTab('text')}
          >
            <FiType size={13} /> <span>Text</span>
          </button>
        )}

        {availableTabs.includes('video') && (
          <button
            type="button"
            className={`${styles['tab-btn']} ${activeTab === 'video' ? styles['active'] : ''}`}
            onClick={() => setActiveTab('video')}
          >
            <FiVideo size={13} /> <span>Video</span>
          </button>
        )}

        {availableTabs.includes('audio') && (
          <button
            type="button"
            className={`${styles['tab-btn']} ${activeTab === 'audio' ? styles['active'] : ''}`}
            onClick={() => setActiveTab('audio')}
          >
            <FiVolume2 size={13} /> <span>Audio</span>
          </button>
        )}

        {availableTabs.includes('speed') && (
          <button
            type="button"
            className={`${styles['tab-btn']} ${activeTab === 'speed' ? styles['active'] : ''}`}
            onClick={() => setActiveTab('speed')}
          >
            <FiZap size={13} /> <span>Speed</span>
          </button>
        )}

        {availableTabs.includes('animation') && (
          <button
            type="button"
            className={`${styles['tab-btn']} ${activeTab === 'animation' ? styles['active'] : ''}`}
            onClick={() => setActiveTab('animation')}
          >
            <FiFilm size={13} /> <span>Animation</span>
          </button>
        )}

        {availableTabs.includes('adjustment') && (
          <button
            type="button"
            className={`${styles['tab-btn']} ${activeTab === 'adjustment' ? styles['active'] : ''}`}
            onClick={() => setActiveTab('adjustment')}
          >
            <FiSliders size={13} /> <span>Adjustment</span>
          </button>
        )}
      </div>

      <div className={styles['inspector-body']}>
        {/* TAB: TEXT */}
        {activeTab === 'text' && availableTabs.includes('text') && (
          <div className={styles['section-content']}>
            <div className={styles['control-group']}>
              <label>Text Content</label>
              <input
                type="text"
                value={textProps.text}
                onChange={(e) => handleTextChange('text', e.target.value)}
              />
            </div>
            <div className={styles['control-group']}>
              <label>Font Size (px)</label>
              <input
                type="range"
                min="12"
                max="120"
                value={textProps.fontSize}
                onChange={(e) => handleTextChange('fontSize', Number(e.target.value))}
              />
              <span>{textProps.fontSize}px</span>
            </div>
            <div className={styles['control-group']}>
              <label>Color</label>
              <input
                type="color"
                value={textProps.color}
                onChange={(e) => handleTextChange('color', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* TAB: VIDEO */}
        {activeTab === 'video' && availableTabs.includes('video') && (
          <div className={styles['section-content']}>
            <div className={styles['control-group']}>
              <label>Scale (%)</label>
              <input
                type="range"
                min="10"
                max="200"
                value={videoProps.scale}
                onChange={(e) => handleVideoChange('scale', Number(e.target.value))}
              />
              <span>{videoProps.scale}%</span>
            </div>
            <div className={styles['control-group']}>
              <label>Opacity (%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={videoProps.opacity}
                onChange={(e) => handleVideoChange('opacity', Number(e.target.value))}
              />
              <span>{videoProps.opacity}%</span>
            </div>
            <div className={styles['control-group']}>
              <label>Rotate (°)</label>
              <input
                type="range"
                min="0"
                max="360"
                value={videoProps.rotation}
                onChange={(e) => handleVideoChange('rotation', Number(e.target.value))}
              />
              <span>{videoProps.rotation}°</span>
            </div>
          </div>
        )}

        {/* TAB: AUDIO */}
        {activeTab === 'audio' && availableTabs.includes('audio') && (
          <div className={styles['section-content']}>
            <div className={styles['control-group']}>
              <label>Volume (%)</label>
              <input
                type="range"
                min="0"
                max="200"
                value={audioProps.volume}
                onChange={(e) => handleAudioChange('volume', Number(e.target.value))}
              />
              <span>{audioProps.volume}%</span>
            </div>
          </div>
        )}

        {/* TAB: SPEED */}
        {activeTab === 'speed' && availableTabs.includes('speed') && (
          <div className={styles['section-content']}>
            <div className={styles['control-group']}>
              <label>Speed</label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={speedProps.speed}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
              />
              <span>{speedProps.speed.toFixed(1)}x</span>
            </div>
          </div>
        )}

        {/* TAB: ANIMATION */}
        {activeTab === 'animation' && availableTabs.includes('animation') && (
          <div className={styles['animation-section']}>
            <div className={styles['sub-tabs']}>
              <button
                type="button"
                className={`${styles['sub-tab-btn']} ${animCategory === 'in' ? styles['active'] : ''}`}
                onClick={() => setAnimCategory('in')}
              >
                In
              </button>
              <button
                type="button"
                className={`${styles['sub-tab-btn']} ${animCategory === 'out' ? styles['active'] : ''}`}
                onClick={() => setAnimCategory('out')}
              >
                Out
              </button>
              <button
                type="button"
                className={`${styles['sub-tab-btn']} ${animCategory === 'combo' ? styles['active'] : ''}`}
                onClick={() => setAnimCategory('combo')}
              >
                Combo
              </button>
            </div>

            <div className={styles['presets-grid']}>
              {filteredPresets.map((preset) => {
                const isSelected = selectedAnimId === preset.id;
                return (
                  <div
                    key={preset.id}
                    className={`${styles['preset-card']} ${isSelected ? styles['selected'] : ''}`}
                    onClick={() => handleSelectAnimation(preset)}
                  >
                    <div className={styles['preset-thumb']}>
                      {preset.id === 'none' ? (
                        <FiEyeOff size={22} className={styles['none-icon']} />
                      ) : (
                        <div className={`${styles['mock-image-bg']} animate__animated ${preset.className}`} />
                      )}
                      {!preset.downloaded && preset.id !== 'none' && (
                        <div className={styles['download-badge']}>
                          <FiDownloadCloud size={11} />
                        </div>
                      )}
                    </div>
                    <span className={styles['preset-name']}>{preset.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: ADJUSTMENT */}
        {activeTab === 'adjustment' && availableTabs.includes('adjustment') && (
          <div className={styles['section-content']}>
            <div className={styles['control-group']}>
              <label>Brightness</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={adjProps.brightness}
                onChange={(e) => handleAdjChange('brightness', Number(e.target.value))}
              />
              <span>{adjProps.brightness}</span>
            </div>
            <div className={styles['control-group']}>
              <label>Contrast</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={adjProps.contrast}
                onChange={(e) => handleAdjChange('contrast', Number(e.target.value))}
              />
              <span>{adjProps.contrast}</span>
            </div>
            <div className={styles['control-group']}>
              <label>Saturation</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={adjProps.saturation}
                onChange={(e) => handleAdjChange('saturation', Number(e.target.value))}
              />
              <span>{adjProps.saturation}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyInspector;