import fs from 'node:fs';
import path from 'node:path';

const RELEASE_VERSION = '1.0.0';
const RELEASE_BUILD = 1;
const MASTER_ICON = 'assets/native/timefillergames-app-icon-1024.png';
const PRIVACY_MANIFEST = 'assets/native/PrivacyInfo.xcprivacy';

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

if (fs.existsSync('android')) {
  const drawableDir = 'android/app/src/main/res/drawable';
  ensureDir(drawableDir);
  fs.writeFileSync(path.join(drawableDir, 'timefillergames_launcher.xml'), `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
  <path android:fillColor="#FFFFFF" android:pathData="M49,13 L59,13 L59,20 L49,20 Z"/>
  <path android:fillColor="#00000000" android:strokeColor="#FFFFFF" android:strokeWidth="5.5" android:pathData="M54,22 C36.3,22 22,36.3 22,54 C22,71.7 36.3,86 54,86 C71.7,86 86,71.7 86,54 C86,36.3 71.7,22 54,22 Z"/>
  <path android:fillColor="#00000000" android:strokeColor="#FFFFFF" android:strokeWidth="4" android:strokeLineCap="round" android:strokeLineJoin="round" android:pathData="M54,35 L54,47 L67,39"/>
  <path android:fillColor="#FFFFFF" android:pathData="M35,49 C31,49 28,53 28,58 L28,65 C28,70 32,74 37,74 L71,74 C76,74 80,70 80,65 L80,58 C80,53 77,49 73,49 Z"/>
  <path android:fillColor="#00000000" android:strokeColor="#5B5DEE" android:strokeWidth="3.5" android:strokeLineCap="round" android:pathData="M37,61 L47,61 M42,56 L42,66"/>
  <path android:fillColor="#22D3C5" android:pathData="M63,55 C65.2,55 67,56.8 67,59 C67,61.2 65.2,63 63,63 C60.8,63 59,61.2 59,59 C59,56.8 60.8,55 63,55 Z"/>
  <path android:fillColor="#FF647C" android:pathData="M71,60 C73.2,60 75,61.8 75,64 C75,66.2 73.2,68 71,68 C68.8,68 67,66.2 67,64 C67,61.8 68.8,60 71,60 Z"/>
  <path android:fillColor="#FFC857" android:pathData="M62,64 C64.2,64 66,65.8 66,68 C66,70.2 64.2,72 62,72 C59.8,72 58,70.2 58,68 C58,65.8 59.8,64 62,64 Z"/>
</vector>
`);

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

if (fs.existsSync('ios/App/App') && fs.existsSync(PRIVACY_MANIFEST)) {
  fs.copyFileSync(PRIVACY_MANIFEST, 'ios/App/App/PrivacyInfo.xcprivacy');
}

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

console.log(`Native release settings applied: Android min 26 / target 36, HTTPS-only transport, version ${RELEASE_VERSION} (${RELEASE_BUILD}), vector launcher icon, TimeFillerGames URL scheme, iOS camera purpose string, and Release 1 privacy manifest source.`);
