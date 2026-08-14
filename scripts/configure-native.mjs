import fs from 'node:fs';
import path from 'node:path';

const RELEASE_VERSION = '1.0.0';
const RELEASE_BUILD = 1;
const MASTER_ICON = 'assets/native/timefillergames-app-icon-1024.png';

function updateFile(filePath, transform) {
  if (!fs.existsSync(filePath)) return false;
  const before = fs.readFileSync(filePath, 'utf8');
  const after = transform(before);
  if (after !== before) fs.writeFileSync(filePath, after);
  return true;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const androidVars = 'android/variables.gradle';
updateFile(androidVars, (text) => text
  .replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 26')
  .replace(/compileSdkVersion\s*=\s*\d+/, 'compileSdkVersion = 36')
  .replace(/targetSdkVersion\s*=\s*\d+/, 'targetSdkVersion = 36'));

const androidBuild = 'android/app/build.gradle';
updateFile(androidBuild, (text) => text
  .replace(/versionCode\s+\d+/, `versionCode ${RELEASE_BUILD}`)
  .replace(/versionName\s+["'][^"']+["']/, `versionName "${RELEASE_VERSION}"`));

const androidManifest = 'android/app/src/main/AndroidManifest.xml';
updateFile(androidManifest, (text) => {
  let next = text;
  if (!/android:usesCleartextTraffic=/.test(next)) {
    next = next.replace(/<application\b/, '<application android:usesCleartextTraffic="false"');
  } else {
    next = next.replace(/android:usesCleartextTraffic="[^"]*"/, 'android:usesCleartextTraffic="false"');
  }
  if (!next.includes('android:scheme="timefillergames"')) {
    const intent = `\n            <intent-filter>\n                <action android:name="android.intent.action.VIEW" />\n                <category android:name="android.intent.category.DEFAULT" />\n                <category android:name="android.intent.category.BROWSABLE" />\n                <data android:scheme="timefillergames" />\n            </intent-filter>`;
    next = next.replace(/\s*<\/activity>/, `${intent}\n        </activity>`);
  }
  return next;
});

if (fs.existsSync('android') && fs.existsSync(MASTER_ICON)) {
  const drawableDir = 'android/app/src/main/res/drawable-nodpi';
  ensureDir(drawableDir);
  fs.copyFileSync(MASTER_ICON, path.join(drawableDir, 'timefillergames_launcher.png'));

  const valuesDir = 'android/app/src/main/res/values';
  ensureDir(valuesDir);
  fs.writeFileSync(path.join(valuesDir, 'timefillergames_launcher.xml'), '<resources>\n  <color name="timefillergames_launcher_background">#5B5DEE</color>\n</resources>\n');

  for (const file of [
    'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
  ]) {
    updateFile(file, (text) => text
      .replace(/<background android:drawable="[^"]+"\s*\/>/, '<background android:drawable="@color/timefillergames_launcher_background" />')
      .replace(/<foreground android:drawable="[^"]+"\s*\/>/, '<foreground android:drawable="@drawable/timefillergames_launcher" />'));
  }
}

const iosPlist = 'ios/App/App/Info.plist';
updateFile(iosPlist, (text) => {
  let next = text;
  if (!next.includes('<key>NSCameraUsageDescription</key>')) {
    next = next.replace('</dict>', '  <key>NSCameraUsageDescription</key>\n  <string>Scan TimeFillerGames room QR codes to join a game.</string>\n</dict>');
  }
  if (!next.includes('<string>timefillergames</string>')) {
    next = next.replace('</dict>', '  <key>CFBundleURLTypes</key>\n  <array>\n    <dict>\n      <key>CFBundleURLName</key>\n      <string>com.timefillergames.app</string>\n      <key>CFBundleURLSchemes</key>\n      <array>\n        <string>timefillergames</string>\n      </array>\n    </dict>\n  </array>\n</dict>');
  }
  return next;
});

const iosProject = 'ios/App/App.xcodeproj/project.pbxproj';
updateFile(iosProject, (text) => text
  .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${RELEASE_VERSION};`)
  .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${RELEASE_BUILD};`));

const iosIconContents = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json';
if (fs.existsSync(iosIconContents) && fs.existsSync(MASTER_ICON)) {
  const contents = JSON.parse(fs.readFileSync(iosIconContents, 'utf8'));
  const iconDir = path.dirname(iosIconContents);
  const images = Array.isArray(contents.images) ? contents.images : [];
  const namedImages = images.filter((image) => typeof image.filename === 'string');
  const unsupported = namedImages.filter((image) => {
    const pointSize = Number(String(image.size ?? '').split('x')[0]);
    const scale = Number(String(image.scale ?? '1x').replace('x', ''));
    return Number.isFinite(pointSize) && Number.isFinite(scale) && pointSize * scale !== 1024;
  });
  if (unsupported.length) {
    throw new Error('Generated iOS AppIcon catalog requires legacy raster sizes. Add approved derived sizes before release packaging.');
  }
  for (const image of namedImages) fs.copyFileSync(MASTER_ICON, path.join(iconDir, image.filename));
}

console.log(`Native release settings applied: Android min 26 / target 36, HTTPS-only transport, version ${RELEASE_VERSION} (${RELEASE_BUILD}), master launcher icon, TimeFillerGames URL scheme, and iOS camera purpose string.`);
