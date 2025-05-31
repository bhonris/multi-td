// Add global window type extensions
interface Window {
  _gameStartNavigationTimer?: ReturnType<typeof setTimeout>;
}
