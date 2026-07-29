import * as SecureStore from 'expo-secure-store';

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/auth/tokenStorage';

describe('tokenStorage', () => {
  const getItemAsync = SecureStore.getItemAsync as jest.Mock;
  const setItemAsync = SecureStore.setItemAsync as jest.Mock;
  const deleteItemAsync = SecureStore.deleteItemAsync as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lit access et refresh séparément', async () => {
    // Arrange
    getItemAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');

    // Act
    const access = await getAccessToken();
    const refresh = await getRefreshToken();

    // Assert
    expect(access).toBe('access');
    expect(refresh).toBe('refresh');
    expect(getItemAsync).toHaveBeenCalledWith('himba.accessToken');
    expect(getItemAsync).toHaveBeenCalledWith('himba.refreshToken');
  });

  it('persiste les deux tokens', async () => {
    await setTokens({ accessToken: 'a', refreshToken: 'r' });

    expect(setItemAsync).toHaveBeenCalledWith('himba.accessToken', 'a');
    expect(setItemAsync).toHaveBeenCalledWith('himba.refreshToken', 'r');
  });

  it('efface les deux tokens au logout', async () => {
    await clearTokens();

    expect(deleteItemAsync).toHaveBeenCalledWith('himba.accessToken');
    expect(deleteItemAsync).toHaveBeenCalledWith('himba.refreshToken');
  });
});
