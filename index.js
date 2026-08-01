/**
 * Point d’entrée Expo — enregistre le PlaybackService RNTP avant expo-router.
 * (requis pour les contrôles lock screen / notification)
 */
import TrackPlayer from 'react-native-track-player';

import { PlaybackService } from './src/services/playbackService';

TrackPlayer.registerPlaybackService(() => PlaybackService);

import 'expo-router/entry';
