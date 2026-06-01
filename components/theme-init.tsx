import Script from "next/script";
import { THEME_STORAGE_KEY } from "@/lib/theme";

/** Tema chiaro di default; scuro solo se scelto esplicitamente dall'utente. */
export function ThemeInit() {
  return (
    <Script id="quotegen-theme-init" strategy="beforeInteractive">
      {`(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);document.documentElement.dataset.theme=t==="dark"?"dark":"light";}catch(e){document.documentElement.dataset.theme="light";}})();`}
    </Script>
  );
}
