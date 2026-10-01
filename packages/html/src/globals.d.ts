declare const __DEV__: boolean;
declare const __PLAYER_VERSION__: string;

declare module '*.css' {
  const content: string;

  export default content;
}

declare module '*.css?inline' {
  const content: string;

  export default content;
}
