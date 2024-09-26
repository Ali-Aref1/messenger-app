import { Global } from "@emotion/react";

function GlobalScrollbarStyles() {
  return (
    <Global
      styles={`
        :root {
          --scrollbar-track: #dadada;
          --scrollbar-thumb: #afb9c6;
          --scrollbar-thumb-hover: #96a0ad;
          --scrollbar-thumb-shadow: #96a0ad;
        }

        /* width */
        ::-webkit-scrollbar {
          width: 12px;
        }

        /* Track */
        ::-webkit-scrollbar-track {
          background: var(--scrollbar-track);
        }

        /* Handle */
        ::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb);
          border-radius: 10px;
          box-shadow: 0 0 2px var(--scrollbar-thumb-shadow);
        }

        /* Handle on hover */
        ::-webkit-scrollbar-thumb:hover {
          background: var(--scrollbar-thumb-hover);
        }
      `}
    />
  );
}

export default GlobalScrollbarStyles;
