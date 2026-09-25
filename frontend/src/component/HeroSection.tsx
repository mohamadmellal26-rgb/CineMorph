import React from 'react';
import styles from './HeroSection.module.css';

export const HeroSection: React.FC = () => {
  const handleCreateClick = () => {
    console.log('Start editing clicked');
  };

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContainer}>
        
        {/* القسم النصوصي */}
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Smart Video Suite</h1>
          <p className={styles.heroDescription}>
            Cut, enhance, and produce cinematic masterpieces effortlessly with our next-generation timeline and intelligent effects.
          </p>
          <div className={styles.heroAction}>
            <button className={styles.heroCtaBtn} onClick={handleCreateClick}>
              Start editing
            </button>
          </div>
        </div>

        {/* قسم العناصر البصرية والتصميم (Mockup) */}
        <div className={styles.heroVisual}>
          <div className={styles.mockupContainer}>
            {/* واجهة محاكاة التطبيق الرئيسية */}
            <div className={styles.appWindowMockup}>
              <div className={styles.mockupScreen}>
                <div className={styles.mockupVideoPreview}>
                  <div className={styles.previewPerson}>
                    <img 
                      src="/imgs.jpg" 
                      alt="Preview Person" 
                      className={styles.previewPersonImg}
                    />
                  </div>
                </div>
                <div className={styles.mockupTimeline}>
                  <div className={styles.timelineTrack}></div>
                  <div className={`${styles.timelineTrack} ${styles.shortTrack}`}></div>
                </div>
              </div>
            </div>

            {/* عناصر عائمة تجميلية */}
            <div className={`${styles.floatingElement} ${styles.element1}`}>FX</div>
            <div className={`${styles.floatingElement} ${styles.element2}`}></div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;