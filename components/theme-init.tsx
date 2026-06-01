import Script from "next/script";

/** Applica il tema salvato prima del paint (evita flash dopo redirect esterni es. Stripe). */
export function ThemeInit() {
  return (
    <Script id="quotegen-theme-init" strategy="beforeInteractive">
      {`(function(){try{var t=localStorage.getItem("quotegen_theme");document.documentElement.dataset.theme=t==="dark"?"dark":"light";}catch(e){document.documentElement.dataset.theme="light";}})();`}
    </Script>
  );
}
