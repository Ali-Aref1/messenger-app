import { useColorMode } from "@chakra-ui/react";
import { useEffect } from "react";
import { Global } from "@emotion/react";

function ScrollbarStyle() {
  const { colorMode } = useColorMode(); // Access the current color mode (light or dark)

  useEffect(() => {
    const root = document.documentElement;

    if (colorMode === "dark") {
      // Set dark mode scrollbar styles
      root.style.setProperty("--scrollbar-track", "hsl(220, 26%, 12%)");
      root.style.setProperty("--scrollbar-thumb", "#4a5568");
      root.style.setProperty("--scrollbar-thumb-hover", "#2d3748");
      root.style.setProperty("--scrollbar-thumb-shadow", "#2d3748");
    } else {
      // Set light mode scrollbar styles
      root.style.setProperty("--scrollbar-track", "#dadada");
      root.style.setProperty("--scrollbar-thumb", "#afb9c6");
      root.style.setProperty("--scrollbar-thumb-hover", "#96a0ad");
      root.style.setProperty("--scrollbar-thumb-shadow", "#96a0ad");
    }
  }, [colorMode]); // Runs every time the color mode changes

  return null;
}

export default ScrollbarStyle;
