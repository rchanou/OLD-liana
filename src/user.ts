export interface User {
  currentNameSet?: string;
  nameSets?: {
    [localeKey: string]: {
      [textKey: string]: string;
    };
  };
}
