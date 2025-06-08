// Add global window type extensions
interface Window {
  _gameStartNavigationTimer?: ReturnType<typeof setTimeout>;
}

// SVG module declarations for Create React App
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  const src: string;
  export default src;
}
