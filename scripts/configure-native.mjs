import fs from 'node:fs';

const RELEASE_VERSION = '1.0.0';
const RELEASE_BUILD = 1;

function updateFile(path, transform) {
  if (!fs.existsSync(path)) return false;
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) fs.writeFileSync(path, after);
  return true;
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

console.log(`Native release settings applied: Android min 26 / target 36, HTTPS-only transport, version ${RELEASE_VERSION} (${RELEASE_BUILD}), TimeFillerGames URL scheme, and iOS camera purpose string.`);
