import React from 'react';
import styles from './CTASection.module.css';

interface CTASectionProps {
  title?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({
  title = "Create videos online with CineMorph",
  buttonText = "Create a video",
  onButtonClick
}) => {
  const handleClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      console.log('CTA button clicked');
    }
  };

  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaContainer}>
        <h2 className={styles.ctaTitle}>{title}</h2>
        <button className={styles.ctaButton} onClick={handleClick}>
          {buttonText}
        </button>
      </div>
    </section>
  );
};

export default CTASection;