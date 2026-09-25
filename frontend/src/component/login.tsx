import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const endpoint = isSignUp ? 'http://localhost:8080/api/signup' : 'http://localhost:8080/api/login';

    const requestBody = isSignUp 
      ? { username, email, password } 
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong, please check your credentials');
      }

      setSuccessMessage(data.message || 'Operation successful!');

      const savedName = isSignUp ? username : email.split('@')[0];
      localStorage.setItem('username', savedName);

      // التوجيه إلى مسار الداشبورد مباشرة
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);

    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect to server');
    }
  };

  return (
    <div className={styles.CineMorphLoginWrapper}>
      
      <div className={styles.loginLeftSection}>
        <div className={styles.loginContentBox}>
          
          <div className={styles.loginHeaderGroup}>
            <h2>{isSignUp ? 'Create an Account' : 'Sign In'}</h2>
            <p>{isSignUp ? 'Enter your details to create a new account!' : 'Then start creating videos!'}</p>
          </div>

          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

          <form onSubmit={handleSubmit} className={styles.authFormContainer}>
            
            {isSignUp && (
              <div className={styles.formGroup}>
                <label>Username</label>
                <input 
                  type="text" 
                  placeholder="mohamad_dev" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                  className={styles.authInput}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Email address</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className={styles.authInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className={styles.authInput}
              />
            </div>

            <button type="submit" className={styles.authSubmitBtn}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className={styles.authDivider}>
            <span>Or continue with one of these options</span>
          </div>

          <div className={styles.loginOptionsList}>
            <button className={`${styles.authOptionBtn} ${styles.googleBtn}`} type="button" onClick={() => navigate('/dashboard')}>
              <svg className={styles.authIcon} viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.19v3.15C3.18 21.31 7.23 24 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.19C.43 8.13 0 9.84 0 12s.43 3.87 1.19 5.39l4.08-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.18 2.69 1.19 6.61l4.08 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button className={`${styles.authOptionBtn} ${styles.workBtn}`} type="button">
              <svg className={styles.authIcon} viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path fill="#3B82F6" d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                <path fill="#2563EB" d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
              </svg>
              <span>Sign in to CineMorph for work or school accounts</span>
            </button>
          </div>

          <div className={styles.toggleAuthMode}>
            <p>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                type="button" 
                onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(''); setSuccessMessage(''); }}
                className={styles.toggleBtn}
              >
                {isSignUp ? 'Sign In' : 'Create one'}
              </button>
            </p>
          </div>

          <div className={styles.loginFooterLinks}>
            <div className={styles.linksRow}>
              <a href="#terms">Terms</a>
              <span>|</span>
              <a href="#privacy">Privacy Statement</a>
              <span>|</span>
              <a href="#health">Consumer Health Data Privacy Policy</a>
            </div>
            <div className={styles.copyrightRow}>
              <Link to="/dashboard">Account Support</Link>
              <span className={styles.copyText}>CineMorph © 2026</span>
            </div>
          </div>

        </div>
      </div>

      <div className={styles.loginRightSection}>
        <div className={styles.promoContainer}>
          <div className={styles.promoBrand}>
            <span className={styles.brandName}>CineMorph</span>
          </div>
          
          <h2>Start creating with templates</h2>
          <p>You can customize our templates by swapping in your own footage, changing the background music and text, or adding a logo.</p>

          <div className={styles.promoGraphicsPreview}>
            <div className={`${styles.previewCard} ${styles.mainPreview}`}>
              <div className={styles.playIcon}>▶</div>
            </div>
            <div className={`${styles.floatingBadge} ${styles.badgeYes}`}>YES</div>
            <div className={`${styles.floatingBadge} ${styles.badgeCloud}`}>🌈☁️</div>
          </div>
        </div>
      </div>

    </div>
  );
};