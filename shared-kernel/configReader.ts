import * as fs from 'fs';
import { FileConfig } from './config';

/**
 * Reads the config file
 * @param pathToConfig {String} Path to config file
 * @throws {ReferenceError} If file not found
 */
class ConfigReader<T> {
  private path: string;

  constructor(pathToConfig: string) {
    if (!fs.existsSync(pathToConfig)) {
      throw new ReferenceError(`Config file by path ${pathToConfig} not found`);
    }

    this.path = pathToConfig;
  }

  /**
   * @throws {TypeError} If file has incorrect format
   */
  public read(): T {
    const content = fs.readFileSync(this.path);

    let jsonContent;
    try {
      jsonContent = JSON.parse(content.toString());
    } catch (e) {
      console.error(`Config file JSON parsing failed; ${e.message}`);
      throw new TypeError(`Config file JSON parsing failed`);
    }

    const config: T = jsonContent;

    return config;
  }
}

export default ConfigReader;