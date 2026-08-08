/**
 * Contenu masqué localement après signalement (choix reporteur).
 * Persisté hors Redux (SecureStore) — hydraté par userId.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { HiddenContentEntry } from '@/lib/reports/hiddenContentStorage';
import type { ReportTargetType } from '@/schemas/reports';

type HiddenContentState = {
  userId: string | null;
  entries: HiddenContentEntry[];
  hydrated: boolean;
};

const initialState: HiddenContentState = {
  userId: null,
  entries: [],
  hydrated: false,
};

const hiddenContentSlice = createSlice({
  name: 'hiddenContent',
  initialState,
  reducers: {
    setHiddenContentHydrated(
      state,
      action: PayloadAction<{
        userId: string;
        entries: HiddenContentEntry[];
      }>,
    ) {
      state.userId = action.payload.userId;
      state.entries = action.payload.entries;
      state.hydrated = true;
    },
    hideReportedContent(
      state,
      action: PayloadAction<{
        targetType: ReportTargetType;
        targetId: string;
      }>,
    ) {
      const { targetType, targetId } = action.payload;
      const exists = state.entries.some(
        (e) => e.targetType === targetType && e.targetId === targetId,
      );
      if (!exists) {
        state.entries.push({ targetType, targetId });
      }
    },
    clearHiddenContentState() {
      return initialState;
    },
  },
});

export const {
  setHiddenContentHydrated,
  hideReportedContent,
  clearHiddenContentState,
} = hiddenContentSlice.actions;

export const hiddenContentReducer = hiddenContentSlice.reducer;
