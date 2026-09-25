import React from 'react';
import styles from './FeaturesSection.module.css';

interface FeatureItem {
  titleMain: string;
  titleHighlight: string;
  description: string;
  links: { label: string; url?: string }[];
  graphicType: 'agent' | 'interactive' | 'programmatic';
}

const featuresData: FeatureItem[] = [
  {
    titleMain: 'Make videos',
    titleHighlight: 'agentically',
    description: 'Turn your idea into a video using your coding agent.',
    links: [
      { label: 'Agent Skills' },
      { label: 'Plugins' }
    ],
    graphicType: 'agent'
  },
  {
    titleMain: 'Make videos',
    titleHighlight: 'interactively',
    description: 'Edit and animate using drag and drop and save back to code.',
    links: [
      { label: 'Studio' },
      { label: 'Elements' }
    ],
    graphicType: 'interactive'
  },
  {
    titleMain: 'Make videos',
    titleHighlight: 'programmatically',
    description: 'Connect data and manage complexity with code.',
    links: [
      { label: 'API Docs' },
      { label: 'Resources' }
    ],
    graphicType: 'programmatic'
  }
];

export const FeaturesSection: React.FC = () => {
  return (
    <section className={styles.featuresSection}>
      <div className={styles.featuresContainer}>
        
        {/* شبكة البطاقات الثلاث */}
        <div className={styles.featuresGrid}>
          {featuresData.map((item, index) => (
            <div className={styles.featureCard} key={index}>
              
               {/* العنصر البصري الخاص بكل بطاقة */}
              <div className={styles.featureGraphic}>
                {item.graphicType === 'agent' && (
                  <div className={`${styles.graphicMockup} ${styles.agentMockup}`}>
                    <div className={styles.mockupBgScreen}>
                      <div className={styles.mapShape}></div>
                    </div>
                    <div className={styles.mockupFloatingBox}>
                      <span className={styles.boxText}>Animate from LA to NY</span>
                      <div className={styles.boxInputLine}>
                        <span>Thinking</span>
                        <div className={styles.arrowBtn}>↑</div>
                      </div>
                    </div>
                  </div>
                )}

                {item.graphicType === 'interactive' && (
                  <div className={`${styles.graphicMockup} ${styles.interactiveMockup}`}>
                    <div className={styles.editorTopBar}>
                      <span className={styles.playIcon}>▶</span>
                      <span className={styles.renderBadge}>Render</span>
                    </div>
                    <div className={styles.editorCanvas}>
                      <div className={`${styles.shapeBubble} ${styles.b1}`}></div>
                      <div className={`${styles.shapeBubble} ${styles.b2}`}></div>
                      <div className={`${styles.shapeBubble} ${styles.b3}`}></div>
                    </div>
                    <div className={styles.editorTimelineBar}>
                      <div className={`${styles.tTrack} ${styles.blueTrack}`}></div>
                      <div className={`${styles.tTrack} ${styles.greenTrack}`}></div>
                      <div className={styles.timelinePin}></div>
                    </div>
                  </div>
                )}

                {item.graphicType === 'programmatic' && (
                  <div className={`${styles.graphicMockup} ${styles.programmaticMockup}`}>
                    <div className={styles.codeBoxTilt}>
                      <div className={styles.codeBadgePill}>you can create</div>
                      <div className={styles.codeTextLine}>&lt;Captions /&gt;</div>
                      <div className={styles.codeTextLine}>&lt;BRoll /&gt;</div>
                      <div className={styles.codeTextLine}>&lt;Video /&gt;</div>
                    </div>
                  </div>
                )}
              </div>

              {/* محتوى النصوص والروابط */}
              <div className={styles.featureContent}>
                <h3 className={styles.featureTitle}>
                  {item.titleMain} <span className={styles.highlight}>{item.titleHighlight}</span>
                </h3>
                <p className={styles.featureDesc}>{item.description}</p>
                
                <div className={styles.featureLinks}>
                  {item.links.map((link, lIndex) => (
                    <a href="#link" className={styles.featureLinkItem} key={lIndex} onClick={(e) => e.preventDefault()}>
                      {link.label} <span className={styles.arrow}>→</span>
                    </a>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* الشريط السفلي التوضيحي */}
        <div className={styles.featuresFooterBanner}>
          <span className={styles.footerIcon}>⚛</span>
          <p>Switch workflows at any time. Code is always the source of truth.</p>
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;