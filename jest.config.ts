import type { Config } from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
    verbose: true,
    transform: {
        '^.+\\.ts?$': 'ts-jest'
    },
    testMatch: ['**/?(*.)+(spec|test).[t]s?(x)']
};
export default config;
