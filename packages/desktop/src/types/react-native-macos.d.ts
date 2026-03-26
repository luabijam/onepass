import 'react-native';

declare module 'react-native' {
  interface HandledKey {
    key: string;
    altKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
  }

  interface KeyEvent {
    key: string;
    altKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
    capsLockKey?: boolean;
    numericPadKey?: boolean;
    helpKey?: boolean;
    functionKey?: boolean;
  }

  interface ViewProps {
    focusable?: boolean;
    enableFocusRing?: boolean;
    acceptsFirstMouse?: boolean;
    allowsVibrancy?: boolean;
    tooltip?: string;
    draggedTypes?: string[];
    mouseDownCanMoveWindow?: boolean;
    keyDownEvents?: HandledKey[];
    keyUpEvents?: HandledKey[];
    onKeyDown?: (event: {nativeEvent: KeyEvent}) => void;
    onKeyUp?: (event: {nativeEvent: KeyEvent}) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onMouseEnter?: (event: {
      nativeEvent: {
        clientX: number;
        clientY: number;
        screenX: number;
        screenY: number;
        altKey: boolean;
        ctrlKey: boolean;
        shiftKey: boolean;
        metaKey: boolean;
      };
    }) => void;
    onMouseLeave?: (event: {
      nativeEvent: {
        clientX: number;
        clientY: number;
        screenX: number;
        screenY: number;
        altKey: boolean;
        ctrlKey: boolean;
        shiftKey: boolean;
        metaKey: boolean;
      };
    }) => void;
    onDoubleClick?: (event: {
      nativeEvent: {
        clientX: number;
        clientY: number;
        screenX: number;
        screenY: number;
        altKey: boolean;
        ctrlKey: boolean;
        shiftKey: boolean;
        metaKey: boolean;
      };
    }) => void;
    onDragEnter?: (event: unknown) => void;
    onDragLeave?: (event: unknown) => void;
    onDrop?: (event: {
      nativeEvent: {
        dataTransfer: {
          files: Array<{
            name: string;
            type: string;
            uri: string;
            size?: number;
            width?: number;
            height?: number;
          }>;
          items: Array<{
            kind: string;
            type: string;
          }>;
          types: string[];
        };
      };
    }) => void;
  }
}
