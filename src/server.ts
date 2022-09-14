/**
 * SERVER.TS
 * Entry point file. The express application is created and started with the desired configuration
 */

import * as dotenv from 'dotenv-flow';
import { Application } from './app';

// Initialize dotenv configuration
dotenv.config();

// Create an application instance
const application = new Application();

// Run the application
application.start();
