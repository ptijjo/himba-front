/**
 * Expo Go (SDK 53+) : les push Android distantes ont été retirées.
 * L’import de `expo-notifications` logue un console.error → LogBox plein écran.
 * On masque uniquement ce message ; les builds natifs / EAS restent inchangés.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { LogBox } from 'react-native';

if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
  LogBox.ignoreLogs([
    'expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go. Read more at https://docs.expo.dev/develop/development-builds/introduction/.',
  ]);
}
