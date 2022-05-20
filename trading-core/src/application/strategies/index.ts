/*
  IMPORTANT!
  Exporting strategy name must be the same as in AvailableStrategies type and in config file
  Otherwise, it will be impossible to instantiate strategy from config file
*/
export { default as SimpleStrategy } from './simple';