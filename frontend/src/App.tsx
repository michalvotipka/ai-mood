import type { User } from './api/auth';
import { UserMenu } from './modules/auth';
import { Mood, MoodCounter } from './modules/mood';
import chatIcon from './assets/icons/chat-emoji.svg';
import styles from './App.module.css';

type AppProps = {
  user: User;
};

export const App = ({ user }: AppProps) => {
  return (
    <main className={styles.main}>
      <UserMenu user={user} />
      <header className={styles.header}>
        <img className={styles.logo} src={chatIcon} alt="" />
        <div>
          <h1 className={styles.title}>AI Mood</h1>
          <p className={styles.subtitle}>Analyze your conversations</p>
          <MoodCounter />
        </div>
      </header>
      <Mood />
    </main>
  );
};
