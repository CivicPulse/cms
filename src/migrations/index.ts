import * as migration_20260311_143013 from './20260311_143013';
import * as migration_20260312_001714 from './20260312_001714';

export const migrations = [
  {
    up: migration_20260311_143013.up,
    down: migration_20260311_143013.down,
    name: '20260311_143013',
  },
  {
    up: migration_20260312_001714.up,
    down: migration_20260312_001714.down,
    name: '20260312_001714'
  },
];
