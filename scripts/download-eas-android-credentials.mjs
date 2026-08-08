/**
 * Télécharge le keystore Android EAS → credentials.json + credentials/android/keystore.jks
 * (sans afficher les secrets). Usage one-shot pour builds Gradle locaux.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const easRoot = path.join(process.env.APPDATA ?? '', 'npm', 'node_modules', 'eas-cli');
if (!fs.existsSync(easRoot)) {
  console.error('eas-cli introuvable dans %APPDATA%/npm/node_modules/eas-cli');
  process.exit(1);
}

const easRequire = createRequire(path.join(easRoot, 'package.json'));

async function main() {
  const appJson = JSON.parse(fs.readFileSync(path.join(projectDir, 'app.json'), 'utf8'));
  const androidPackage = appJson?.expo?.android?.package;
  const owner = appJson?.expo?.owner;
  const slug = appJson?.expo?.slug;
  if (!androidPackage || !owner || !slug) {
    throw new Error('app.json incomplet (owner / slug / android.package)');
  }

  const SessionManager = easRequire('./build/user/SessionManager.js').default;
  const { createGraphqlClient } = easRequire(
    './build/commandUtils/context/contextUtils/createGraphqlClient.js',
  );
  const AndroidGraphql = easRequire('./build/credentials/android/api/GraphqlClient.js');
  const { updateAndroidCredentialsAsync } = easRequire(
    './build/credentials/credentialsJson/update.js',
  );
  const { resolveVcsClient } = easRequire('./build/vcs/index.js');

  // Analytics minimal (évite login interactif si session Expo déjà présente)
  const analytics = { setActor() {} };
  const sessionManager = new SessionManager(analytics);
  const { actor, authenticationInfo } = await sessionManager.ensureLoggedInAsync({
    nonInteractive: true,
  });
  const graphqlClient = createGraphqlClient(authenticationInfo);

  const appLookupParams = {
    accountName: owner,
    projectName: slug,
    androidApplicationIdentifier: androidPackage,
  };

  const appCredentials =
    await AndroidGraphql.getAndroidAppCredentialsWithCommonFieldsAsync(
      graphqlClient,
      appLookupParams,
    );
  const buildCredentialsList = appCredentials?.androidAppBuildCredentialsList ?? [];
  const buildCredentials =
    buildCredentialsList.find((c) => c.isDefault) ?? buildCredentialsList[0] ?? null;
  if (!buildCredentials?.androidKeystore) {
    throw new Error('Aucun keystore Android trouvé sur EAS pour ce projet');
  }

  const vcsClient = resolveVcsClient(false);
  const ctx = {
    projectDir,
    graphqlClient,
    user: actor,
    vcsClient,
    nonInteractive: true,
  };

  await updateAndroidCredentialsAsync(ctx, buildCredentials);

  const credPath = path.join(projectDir, 'credentials.json');
  const jksPath = path.join(projectDir, 'credentials', 'android', 'keystore.jks');
  if (!fs.existsSync(credPath) || !fs.existsSync(jksPath)) {
    throw new Error('credentials.json ou keystore.jks manquant après sync');
  }

  console.log('OK — credentials.json + keystore.jks synchronisés depuis EAS (secrets non affichés).');
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
