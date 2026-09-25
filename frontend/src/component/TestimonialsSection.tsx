import React from 'react';
import styles from './TestimonialsSection.module.css';

// تعريف هيكل البيانات (TypeScript Interfaces)
interface Testimonial {
  id: number;
  authorName: string;
  authorRole: string;
  avatar: string;
  avatarBg?: string;
  quote: string;
  platformName: string;
  platformLogo: string;
  platformColorKey: 'blueStars' | 'orangeStars'; // تم تحسين التقديم للربط مع CSS Modules
  rating: number;
  reviewsCount: string;
}

// مصفوفة البيانات (Data)
const testimonialsData: Testimonial[] = [
  {
    id: 1,
    authorName: "Monika",
    authorRole: "Trustpilot review",
    avatar: "M",
    avatarBg: "#00b67a",
    quote: "I never expected that a free version would have all these features. I was amazed and honestly grateful for having a free, well-featured, and user-friendly video editing site. I loved every bit of experience while using it. CineMorph video editor is my primary video editing software for my social media content.",
    platformName: "facebook",
    platformLogo: "f",
    platformColorKey: "blueStars",
    rating: 4.8,
    reviewsCount: "9.5k+ reviews"
  },
  {
    id: 2,
    authorName: "Mr. Paper",
    authorRole: "YouTuber",
    avatar: "",
    quote: "I love how easy it is to use CineMorph video editor online. It really has opened the door for anyone to create great video, no matter your experience or skill. Whether you're an aspiring creator or a seasoned vlogger, CineMorph has got you covered with unique features and unlimited exports.",
    platformName: "Product Hunt",
    platformLogo: "P",
    platformColorKey: "orangeStars",
    rating: 5.0,
    reviewsCount: "500+ reviews"
  }
];

// مكون النجوم
const StarRating: React.FC<{ rating: number; colorKey: 'blueStars' | 'orangeStars' }> = ({ colorKey }) => {
  return (
    <div className={`${styles.starsContainer} ${styles[colorKey]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={styles.star}>★</span>
      ))}
    </div>
  );
};

export const TestimonialsSection: React.FC = () => {
  return (
    <section className={styles.testimonialsSection}>
      <div className={styles.testimonialsContainer}>
        {/* عنوان القسم */}
        <h2 className={styles.testimonialsTitle}>Join millions of everyday video editors</h2>

        {/* شبكة البطاقات */}
        <div className={styles.testimonialsGrid}>
          {testimonialsData.map((item) => (
            <div className={styles.testimonialCardWrapper} key={item.id}>
              
              {/* معلومات الكاتب والفقاعة */}
              <div className={styles.testimonialTop}>
                <div className={styles.authorInfo}>
                  {item.avatar.startsWith('http') ? (
                    <img src={item.avatar} alt={item.authorName} className={styles.authorAvatarImg} />
                  ) : (
                    <div className={styles.authorAvatarFallback} style={{ backgroundColor: item.avatarBg }}>
                      {item.avatar || item.authorName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className={styles.authorName}>{item.authorName}</h3>
                    <p className={styles.authorRole}>{item.authorRole}</p>
                  </div>
                </div>

                <div className={styles.speechBubble}>
                  <p>{item.quote}</p>
                </div>
              </div>

              {/* بطاقة المنصة السفلية */}
              <div className={styles.platformFooterCard}>
                <div className={styles.platformBrand}>
                  {item.platformName === 'facebook' ? (
                    <div className={styles.fbLogoWrapper}>
                      <span className={styles.fbIcon}>f</span>
                      <span className={styles.fbText}>facebook</span>
                    </div>
                  ) : (
                    <div className={styles.phLogoWrapper}>
                      <span className={styles.phIcon}>P</span>
                      <span className={styles.phText}>Product Hunt</span>
                    </div>
                  )}
                </div>

                <div className={styles.platformRatingDetails}>
                  <StarRating rating={item.rating} colorKey={item.platformColorKey} />
                  <span className={styles.ratingText}>
                    {item.rating} — {item.reviewsCount}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;