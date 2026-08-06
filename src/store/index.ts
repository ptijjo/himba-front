import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';

import { baseApi } from '@/store/api/baseApi';
import { setupRtkListeners } from '@/store/setupRtkListeners';
import { authReducer } from '@/store/slices/authSlice';
import { playerReducer } from '@/store/slices/playerSlice';

import '@/store/api/albumsApi';
import '@/store/api/artistsApi';
import '@/store/api/notificationsApi';
import '@/store/api/authApi';
import '@/store/api/libraryApi';
import '@/store/api/paymentsApi';
import '@/store/api/ratingsApi';
import '@/store/api/reportsApi';
import '@/store/api/tracksApi';
import '@/store/api/usersApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    player: playerReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(baseApi.middleware),
});

// Catalogue partagé : refetch quand l’app revient au premier plan (AppState).
setupRtkListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
