export type BeforeExit = () => Promise<void>;

export interface Logger {
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  warn(msg: any, ...args: any[]): void;
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  info(msg: any, ...args: any[]): void;
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  error(msg: any, ...args: any[]): void;
}
