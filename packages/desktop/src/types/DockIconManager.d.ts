declare module 'react-native' {
  interface DockIconManagerInterface {
    setLockState(isLocked: boolean): void;
    setBadge(count: number): void;
    clearBadge(): void;
    setDockMenu(
      items: Array<{
        id: string;
        label: string;
        enabled?: boolean;
        separator?: boolean;
      }>,
    ): void;
    onDockMenuItemSelected(callback: (itemId: string) => void): {
      remove: () => void;
    } | null;
    bounce(): void;
    bounceCritical(): void;
    cancelBounce(): void;
  }

  interface LogFileWriterInterface {
    writeLog(logLine: string): Promise<void>;
    getLogFilePath(): Promise<string>;
    clearLogFile(): Promise<void>;
    getLogFileSize(): Promise<number>;
    rotateLogIfNeeded(maxSizeMB: number): Promise<boolean>;
    readLastLines(linesCount: number): Promise<string>;
  }

  interface NativeModulesStatic {
    DockIconManager?: DockIconManagerInterface;
    LogFileWriter?: LogFileWriterInterface;
  }

  // Export Platform and NativeModules for use in TypeScript
  export const Platform: {
    OS: string;
    Version: string | number;
    isPad: boolean;
    isTV: boolean;
    select<T>(specifics: {
      ios?: T;
      android?: T;
      macos?: T;
      windows?: T;
      web?: T;
      default: T;
    }): T;
  };

  export const NativeModules: NativeModulesStatic;
}
