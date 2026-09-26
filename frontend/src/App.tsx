import chatIcon from './assets/icons/chat-emoji.svg';
import styles from './App.module.css';

export const App = () => {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <img className={styles.logo} src={chatIcon} alt="" />
        <div>
          <h1 className={styles.title}>AI Mood</h1>
          <p className={styles.subtitle}>Analyze your conversations</p>
        </div>
      </header>
    </main>
  );
};
