import * as path from 'path';

import ConfigReader from '@shared-kernel/configReader';
import { FileConfig } from '@shared-kernel/config';


import type { AvailableStrategies } from './strategies/index.types';


class ConfigProvider {
  public static get(): FileConfig<AvailableStrategies> {
    const configFilePath = path.resolve(process.env.CONFIG_FILE || '../config.json');
    const configReader = new ConfigReader<FileConfig<AvailableStrategies>>(configFilePath);
    const config = configReader.read();

    this.validate(config);

    return config;
  }

  private static validate(candidate: any): void {
    const prefix = 'Config file validation failed:';
    if (!candidate.trade) throw new TypeError(`${prefix} No 'trade' property`);
    if (!Array.isArray(candidate.trade)) throw new TypeError(`${prefix} 'trade' property must be an array`);

    // TODO: Implement validation of each trade
  }
}

export default ConfigProvider;