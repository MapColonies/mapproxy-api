// This file handles the tracing initialization and starts the tracing process before the app starts.
// You should be careful about editing this file, as it is a critical part of the application's functionality.
// Because this file is a module it should imported using the `--import` flag in the `node` command, and should not be imported by any other file.
import { tracingFactory } from './common/tracing.js';
import { getConfig, initConfig } from './common/config.js';

await initConfig();

const config = getConfig();

const tracingConfig = config.get('telemetry.tracing');
const sharedConfig = config.get('telemetry.shared');

const tracing = tracingFactory({ ...tracingConfig, ...sharedConfig });

tracing.start();
