# Push Android — FCM v1 (EAS)

Les notifications **système** Android passent par **Firebase Cloud Messaging (FCM) v1** sur le projet EAS. Sans cette étape, l’API peut toujours remplir le fil **Actus** in-app, mais aucune bannière n’apparaît sur l’appareil.

Référence Expo : [FCM credentials](https://docs.expo.dev/push-notifications/fcm-credentials/).

## Projet Himba

| Champ | Valeur |
|-------|--------|
| Package Android | `fr.cellulenoire.himba` |
| EAS projectId | `3b64aa6a-1789-4529-a8f6-9231feb5b38f` (dans `app.json` → `extra.eas`) |
| Canal Android | `sorties` (plugin `expo-notifications` + `setNotificationChannelAsync`) |

## Checklist avant build Play

1. Projet Firebase lié au package Android `fr.cellulenoire.himba`.
2. Activer l’API **Firebase Cloud Messaging API (V1)** dans Google Cloud.
3. Créer une clé **service account** FCM et l’uploader dans les credentials EAS :
   ```bash
   eas credentials -p android
   ```
   → Google Service Account / FCM V1 → upload du JSON Firebase.
4. Rebuild natif production (`eas build --platform android --profile production`) — bump `version` / `versionCode` pour un nouvel upload Play.
5. Vérifier sur un **appareil physique** : permission notifs + réception d’une sortie artiste suivi.

> La commande `eas credentials` est interactive : la présence de la clé FCM doit être confirmée manuellement dans le dashboard Expo ou via cette CLI avant chaque release Play qui doit pousser des notifs.

## iOS (hors chantier immédiat)

APNs + credentials Apple seront nécessaires pour les builds iOS. `UIBackgroundModes` audio et le plugin `expo-notifications` sont déjà préparés côté app.

## Audio écran verrouillé

`shouldPlayInBackground: true` + `UIBackgroundModes: ["audio"]` exigent aussi un **nouveau build natif** (Expo Go insuffisant pour valider le background audio iOS / FGS Android).
