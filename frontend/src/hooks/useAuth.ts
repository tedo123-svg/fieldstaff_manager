import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { loginSuccess, logout } from '../store/authSlice';
import type { User } from '../types';

export function useAuth() {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated } = useSelector((s: RootState) => s.auth);

  const login = (user: User, token: string) => dispatch(loginSuccess({ user, token }));
  const signOut = () => dispatch(logout());

  return { user, token, isAuthenticated, login, signOut };
}
