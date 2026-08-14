import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';

const originalExecFileSync = childProcess.execFileSync;
childProcess.execFileSync = (file, args = [], options) => {
  if (file === '/usr/bin/sips' && args[0] === '--flatten') {
    const outIndex = args.indexOf('--out');
    const inputPath = outIndex > 0 ? args[outIndex - 1] : null;
    const outputPath = outIndex >= 0 ? args[outIndex + 1] : null;
    if (!inputPath || !outputPath) throw new Error('Could not resolve iOS AppIcon flatten input/output paths.');
    return originalExecFileSync('/usr/bin/swift', ['scripts/flatten-ios-icon.swift', inputPath, outputPath], options);
  }
  return originalExecFileSync(file, args, options);
};
syncBuiltinESMExports();

await import('./configure-native.mjs');
