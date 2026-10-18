import { signOut, type User } from '../../../api/auth';
import styles from './UserMenu.module.css';

type UserMenuProps = {
  user: User;
};

export const UserMenu = ({ user }: UserMenuProps) => {
  return (
    <div className={styles.userMenu}>
      <span className={styles.userName}>{user.name}</span>
      <button type="button" className={styles.signOut} onClick={signOut}>
        Sign out
      </button>
    </div>
  );
};
