/**
 * Slice auth — état UI uniquement (user / flags). Les tokens restent dans SecureStore.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AuthUser } from '@/schemas/auth';

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser }>) {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    setHydrated(state, action: PayloadAction<boolean>) {
      state.isHydrated = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    clearCredentials(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
});

export const { setCredentials, setHydrated, setLoading, clearCredentials } =
  authSlice.actions;
export const authReducer = authSlice.reducer;
