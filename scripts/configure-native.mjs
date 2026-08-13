import fs from 'node:fs';

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

const androidManifest = 'android/app/src/main/AndroidManifest.xml';
updateFile(androidManifest, (text) => {
  if (text.includes('android:scheme="timefillergames"')) return text;
  const intent = `\n            <intent-filter>\n                <action android:name="android.intent.action.VIEW" />\n                <category android:name="android.intent.category.DEFAULT" />\n                <category android:name="android.intent.category.BROWSABLE" />\n                <data android:scheme="timefillergames" />\n            </intent-filter>`;
  return text.replace(/\s*<\/activity>/, `${intent}\n        </activity>`);
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

console.log('Native release settings applied: Android min 26 / target 36, TimeFillerGames URL scheme, iOS camera purpose string.');
