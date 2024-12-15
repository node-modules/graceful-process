export type BeforeExit = () => Promise<void>;

export interface Logger {
  warn(msg: any, ...args: any[]): void;
  info(msg: any, ...args: any[]): void;
  error(msg: any, ...args: any[]): void;
}
