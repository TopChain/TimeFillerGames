import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';

const originalExecFileSync = childProcess.execFileSync;
childProcess.execFileSync = (file, args = [], options) => {
  const normalizedArgs = file === '/usr/bin/sips'
    ? args.map((value) => value === '#5B5DEE' ? '91 93 238 1' : value)
    : args;
  return originalExecFileSync(file, normalizedArgs, options);
};
syncBuiltinESMExports();

await import('./configure-native.mjs');
