import React, { useState } from 'react';
import styles from './Footer.module.css';

interface FooterColumn {
  title: string;
  links: string[];
}

const footerData: FooterColumn[] = [
  {
    title: 'Create',
    links: [
      'Slideshow videos',
      'Promo videos',
      'Demo videos',
      'Video memes',
      'Video montages',
      'YouTube videos',
      'Instagram videos',
      'Instagram Reels',
      'TikTok videos',
      'Facebook video ads'
    ]
  },
  {
    title: 'Tools',
    links: [
      'Edit video',
      'Rotate video',
      'Trim video',
      'Crop video',
      'Record webcam',
      'Record screen',
      'AI subtitle generator',
      'AI voiceover generator',
      'Add text to video',
      'Voice and audio recorder',
      'GIF maker',
      'Remove audio from video'
    ]
  },
  {
    title: 'About',
    links: [
      'Products',
      'Pricing',
      'Company',
      'Work with us'
    ]
  },
  {
    title: 'Learn',
    links: [
      'Blog',
      'Video marketing',
      'Video editing',
      'Training center'
    ]
  },
  {
    title: 'Video editing apps',
    links: [
      'CineMorph video editor',
      'Microsoft CineMorph for Windows',
      'CineMorph for work',
      'CineMorph for education'
    ]
  }
];

export const Footer: React.FC = () => {
  const [language, setLanguage] = useState('English');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const languages = ['English', 'العربية', 'Français', 'Español', 'Deutsch'];

  return (
    <footer className={styles.footerSection}>
      <div className={styles.footerContainer}>
        
        {/* أعمدة الروابط العليا */}
        <div className={styles.footerColumnsGrid}>
          {footerData.map((col, idx) => (
            <div className={styles.footerColumn} key={idx}>
              <h4 className={styles.footerColTitle}>{col.title}</h4>
              <ul className="footer-links-list">
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <a href="#link" onClick={(e) => e.preventDefault()} className={styles.footerLink}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>

              {/* إضافة قسم الدعم في أسفل عمود 'Video editing apps' */}
              {col.title === 'Video editing apps' && (
                <div className={styles.footerSubSection}>
                  <h4 className={styles.footerColTitle}>Support</h4>
                  <ul className={styles.footerLinksList}>
                    <li><a href="#link" onClick={(e) => e.preventDefault()} className={styles.footerLink}>Help</a></li>
                    <li><a href="#link" onClick={(e) => e.preventDefault()} className={styles.footerLink}>Contact</a></li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* الشريط السفلي (اللغة وأيقونات السوشيال ميديا) */}
        <div className={styles.footerBottomBar}>
          
          {/* زر اختيار اللغة */}
          <div className={styles.languageSelectorWrapper}>
            <div 
              className={styles.languageDropdownBtn} 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className={styles.langIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </span>
              <span>{language}</span>
              <span className={`${styles.arrowIcon} ${isDropdownOpen ? styles.open : ''}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </div>

            {isDropdownOpen && (
              <ul className={styles.languageMenu}>
                {languages.map((lang, index) => (
                  <li 
                    key={index} 
                    onClick={() => {
                      setLanguage(lang);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {lang}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* أيقونات السوشيال ميديا */}
          <div className={styles.socialIconsGroup}>
            {/* YouTube */}
            <a href="#youtube" onClick={(e) => e.preventDefault()} aria-label="YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            {/* X / Twitter */}
            <a href="#x" onClick={(e) => e.preventDefault()} aria-label="X">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            {/* Instagram */}
            <a href="#instagram" onClick={(e) => e.preventDefault()} aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            {/* Facebook */}
            <a href="#facebook" onClick={(e) => e.preventDefault()} aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.8l.2-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            {/* LinkedIn */}
            <a href="#linkedin" onClick={(e) => e.preventDefault()} aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
            {/* TikTok */}
            <a href="#tiktok" onClick={(e) => e.preventDefault()} aria-label="TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
            </a>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;