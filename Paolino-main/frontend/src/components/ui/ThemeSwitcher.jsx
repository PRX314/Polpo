import { useTheme } from '../../contexts/ThemeContext';
import './ThemeSwitcher.css';

const ThemeSwitcher = () => {
  const { currentHeaderTheme, cycleHeaderTheme, toggleGlobalDarkMode } = useTheme();

  const handleClick = (e) => {
    if (e.shiftKey) {
      // Shift + Click = toggle global dark mode
      toggleGlobalDarkMode();
    } else {
      // Click normale = cicla i temi header
      cycleHeaderTheme();
    }
  };

  return (
    <button
      className="theme-switcher"
      onClick={handleClick}
      title={`Click: ${currentHeaderTheme.label} | Shift+Click: Dark Mode`}
      aria-label="Cambia tema"
    >
      <span className="theme-switcher-icon">{currentHeaderTheme.icon}</span>
      <span className="theme-switcher-label">{currentHeaderTheme.label}</span>
    </button>
  );
};

export default ThemeSwitcher;
