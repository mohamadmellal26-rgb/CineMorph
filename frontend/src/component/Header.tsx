import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

interface NavItem {
  label: string;
  hasDropdown?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Features', hasDropdown: true },
  { label: 'Create', hasDropdown: true },
  { label: 'For work', hasDropdown: true },
  { label: 'Learn', hasDropdown: true },
  { label: 'Pricing', hasDropdown: false },
  { label: 'About', hasDropdown: true },
];

export const Header: React.FC = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('username');
    if (storedUser) {
      setIsLoggedIn(true);
      setUsername(storedUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    navigate('/');
  };

  const toggleDropdown = (label: string) => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  return (
    <header className={styles.siteHeader}>
      <div className={styles.headerContainer}>
        
        {/* الشعار */}
        <Link to="/" className={styles.headerLogoLink}>
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
        </Link>

        {/* القائمة الرئيسية */}
        <nav className={styles.headerNav}>
          <ul>
            {navItems.map((item) => (
              <li key={item.label} className={styles.navItem}>
                <button 
                  className={styles.navLink} 
                  onClick={() => item.hasDropdown && toggleDropdown(item.label)}
                >
                  {item.label}
                  {item.hasDropdown && (
                    <svg 
                      className={`${styles.chevronIcon} ${activeDropdown === item.label ? styles.rotate : ''}`} 
                      width="12" 
                      height="12" 
                      viewBox="0 0 12 12" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* أزرار الحساب والإجراءات */}
        <div className={styles.headerActions}>
          {isLoggedIn ? (
            <div className={styles.userProfile}>
              <span className={styles.userGreeting}>مرحباً، {username}</span>
              <button 
                onClick={handleLogout} 
                className={`${styles.btn} ${styles.btnSecondary}`}
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login" className={styles.btnLink}>
              <span className={`${styles.btn} ${styles.btnSecondary}`}>Sign in</span>
            </Link>
          )}
          <Link to="/editor" className={styles.btnLink}>
            <span className={`${styles.btn} ${styles.btnPrimary}`}>Try for free</span>
          </Link>
        </div>

      </div>
    </header>
  );
};

export default Header;