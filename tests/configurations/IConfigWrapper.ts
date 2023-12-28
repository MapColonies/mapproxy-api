import * as originalConfig from 'config';

export interface ConfigWrapper {
  getConfig: () => Record<string, any>;
  setConfig: (newConfig: Record<string, any>) => void;
}

let currentConfig = { ...originalConfig };

export const configWrapper: ConfigWrapper = {
  getConfig: () => currentConfig,
  setConfig: (newConfig) => {
    const updateNestedConfig = (target: Record<string, any>, update: Record<string, any>) => {
      for (const key in update) {
        if (Object.prototype.hasOwnProperty.call(update, key)) {
          if (typeof update[key] === 'object' && !Array.isArray(update[key]) && target[key]) {
            // Recursively update nested properties
            updateNestedConfig(target[key], update[key]);
          } else {
            // Update the property
            target[key] = update[key];
          }
        }
      }
    };

    updateNestedConfig(currentConfig, newConfig);
  },
};