import React, { useState } from 'react';
import {
  Home as HomeIcon,
  LayoutGrid,
  Plus,
  Sparkles,
  Search,
  Share2,
  Settings,
  HelpCircle,
  Gamepad2,
  Briefcase,
  SlidersHorizontal,
  Upload,
  Loader2,
} from 'lucide-react';
import styles from './Dashboard.module.css';

// أيقونة YouTube مخصصة كـ SVG لمنع أخطاء Lucide React
const YoutubeIcon: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

// أيقونة Instagram مخصصة كـ SVG
const InstagramIcon: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export interface DashboardProps {
  onNewVideo?: () => void;
  onAiVideo?: () => void;
  onSelectTemplate?: (templateId: string) => void;
}

interface TemplateCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  bg: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNewVideo,
  onAiVideo,
  onSelectTemplate,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCreateNewVideo = () => {
    setIsLoading(true);
    if (onNewVideo) {
      onNewVideo();
    }
    setTimeout(() => {
      window.location.href = 'http://localhost:5173/editor';
    }, 1200);
  };

  const templateCategories: TemplateCategory[] = [
    { id: 'yt', name: 'YouTube', icon: <YoutubeIcon size={28} />, bg: 'linear-gradient(135deg, #ff0000, #cc0000)' },
    { id: 'insta', name: 'Instagram', icon: <InstagramIcon size={28} />, bg: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' },
    { id: 'intro', name: "Modèles d'introd...", icon: <Sparkles size={28} />, bg: 'linear-gradient(135deg, #00c6ff, #0072ff)' },
    { id: 'games', name: 'Jeux', icon: <Gamepad2 size={28} />, bg: 'linear-gradient(135deg, #111827, #374151)' },
    { id: 'business', name: "Modèles d'entrep...", icon: <Briefcase size={28} />, bg: 'linear-gradient(135deg, #d97706, #b45309)' },
    { id: 'slides', name: 'Diaporamas', icon: <LayoutGrid size={28} />, bg: 'linear-gradient(135deg, #a855f7, #6366f1)' },
  ];

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          gap: '16px',
        }}
      >
        <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
        <p style={{ fontSize: '18px', fontWeight: 500, color: '#1e293b' }}>Chargement de CineMorph...</p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logoArea}>
            <svg width="24" height="20" viewBox="0 0 28 24" fill="none">
              <path d="M4 3C2.34315 3 1 4.34315 1 6V18C1 19.6569 2.34315 21 4 21H24C25.6569 21 27 19.6569 27 18V6C27 4.34315 25.6569 3 24 3H4Z" fill="url(#cinemorph_grad)" />
              <path d="M1 9H27M1 15H27" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" />
              <defs>
                <linearGradient id="cinemorph_grad" x1="1" y1="3" x2="27" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8A2BE2" />
                  <stop offset="0.5" stopColor="#9933FF" />
                  <stop offset="1" stopColor="#00C4CC" />
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.logoText}>CineMorph</span>
          </div>

          <nav className={styles.navMenu}>
            <button type="button" className={`${styles.navItem} ${styles.active}`}>
              <HomeIcon size={18} />
              <span>Accueil</span>
            </button>
            <button type="button" className={styles.navItem}>
              <LayoutGrid size={18} />
              <span>Modèles</span>
            </button>
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.cloudStorageBox}>
            <span className={styles.storageTitle}>Stockage cloud</span>
            <div className={styles.storageBarWrapper}>
              <div className={styles.storageBar} style={{ width: '2%' }} />
            </div>
            <span className={styles.storageText}>1.16 MB utilisé sur 5 GB (0%)</span>
            <button type="button" className={styles.btnUpgrade}>Obtenez plus d'espace</button>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className={styles.mainWrapper}>
        <header className={styles.header}>
          <div className={styles.searchContainer}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher des modèles"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.headerActions}>
            <button type="button" className={styles.iconBtn} title="Partager">
              <Share2 size={18} />
            </button>
            <button type="button" className={styles.iconBtn} title="Paramètres">
              <Settings size={18} />
            </button>
            <button type="button" className={styles.iconBtn} title="Aide">
              <HelpCircle size={18} />
            </button>
            <div className={styles.avatar} title="Mon Profil">
              MM
            </div>
          </div>
        </header>

        <main className={styles.content}>
          <h1 className={styles.welcomeTitle}>Bienvenue !</h1>

          <div className={styles.heroGrid}>
            <div className={styles.heroCardPrimary} onClick={handleCreateNewVideo} role="button" tabIndex={0}>
              <div className={styles.heroContent}>
                <h3>Création d'une nouvelle vidéo</h3>
                <p>Démarrer à partir de zéro</p>
              </div>
              <div className={styles.heroIconBtn}>
                <Plus size={20} />
              </div>
            </div>

            <div className={styles.heroCardAi} onClick={onAiVideo} role="button" tabIndex={0}>
              <div className={styles.heroContent}>
                <h3>Création d'une vidéo avec l'IA</h3>
                <p>Composez rapidement et automatiquement une vidéo à l'aide de l'IA</p>
              </div>
              <div className={styles.heroIconBtn}>
                <Sparkles size={20} />
              </div>
            </div>
          </div>

          <section className={styles.sectionContainer}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Démarrage avec ces modifications faciles</h2>
            </div>

            <div className={styles.quickToolsGrid}>
              <div className={styles.quickToolCard}>
                <div className={styles.toolMediaPreview}>
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80" alt="Webcam recording" />
                </div>
                <div className={styles.toolInfo}>
                  <div>
                    <h4>Enregistrez vous-même</h4>
                    <p>Utiliser votre microphone, votre écran ou votre webcam</p>
                  </div>
                  <button type="button" className={styles.btnTry}>Essayez-le</button>
                </div>
              </div>

              <div className={styles.quickToolCard}>
                <div className={styles.toolMediaPreview}>
                  <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80" alt="Text to speech" />
                </div>
                <div className={styles.toolInfo}>
                  <div>
                    <h4>Synthèse vocale</h4>
                    <p>Découvrez des voix réalistes dans plus de 80 langues</p>
                  </div>
                  <button type="button" className={styles.btnTry}>Essayez-le</button>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.sectionContainer}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Inspirez-vous d'un modèle</h2>
              <a href="#templates" className={styles.seeAllLink}>
                Tous les modèles
              </a>
            </div>

            <div className={styles.templatesGrid}>
              {templateCategories.map((cat) => (
                <div
                  key={cat.id}
                  className={styles.templateItem}
                  onClick={() => onSelectTemplate?.(cat.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.templateThumb} style={{ background: cat.bg }}>
                    {cat.icon}
                  </div>
                  <span className={styles.templateName}>{cat.name}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.sectionContainer}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Vos vidéos</h2>
              <div className={styles.recentControls}>
                <button type="button" className={styles.recentControlBtn}>
                  <SlidersHorizontal size={14} />
                  <span>Trier par</span>
                </button>
                <button type="button" className={styles.recentControlBtn}>
                  <Upload size={14} />
                  <span>Importer</span>
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;