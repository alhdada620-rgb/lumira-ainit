import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { PiDebugOverlay } from "@/components/lumira/PiDebugOverlay";

const INITIAL_LOADER_CSS = `#initial-loader{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#0b0b12;color:#e8e6f3;font-family:'Tajawal','Inter',system-ui,sans-serif;z-index:9999;transition:opacity .35s ease}#initial-loader.hide{opacity:0;pointer-events:none}#initial-loader .ring{width:54px;height:54px;border-radius:50%;border:3px solid rgba(255,255,255,.12);border-top-color:#a78bfa;animation:lumira-spin .9s linear infinite}#initial-loader .brand{font-size:20px;font-weight:700;letter-spacing:.5px;background:linear-gradient(90deg,#a78bfa,#f0abfc);-webkit-background-clip:text;background-clip:text;color:transparent}#initial-loader .hint{font-size:13px;opacity:.6}@keyframes lumira-spin{to{transform:rotate(360deg)}}`;

const INITIAL_LOADER_HIDE_JS = `(function(){function hide(){var el=document.getElementById('initial-loader');if(!el)return;el.classList.add('hide');setTimeout(function(){el&&el.parentNode&&el.parentNode.removeChild(el)},400)}if(document.readyState==='complete'){setTimeout(hide,50)}else{window.addEventListener('load',function(){setTimeout(hide,50)})}setTimeout(hide,5000);})();`;


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lumira · المراية الذكية للصحة والأناقة" },
      { name: "description", content: "Lumira - تطبيق المراية الذكية للصحة والأناقة على Pi Network. تحليل البشرة بالذكاء الاصطناعي، تجربة الأزياء، ولوحة صحية ذكية." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lumira · المراية الذكية للصحة والأناقة" },
      { property: "og:description", content: "Lumira - تطبيق المراية الذكية للصحة والأناقة على Pi Network. تحليل البشرة بالذكاء الاصطناعي، تجربة الأزياء، ولوحة صحية ذكية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Lumira · المراية الذكية للصحة والأناقة" },
      { name: "twitter:description", content: "Lumira - تطبيق المراية الذكية للصحة والأناقة على Pi Network." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/qBiC3UTMEGMU7NGx1VCYS5AMicw1/social-images/social-1776735981793-IMG_٢٠٢٦٠٤١٧_١١٥٧١٥.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/qBiC3UTMEGMU7NGx1VCYS5AMicw1/social-images/social-1776735981793-IMG_٢٠٢٦٠٤١٧_١١٥٧١٥.webp" },
      { name: "google-site-verification", content: "CDY6LwXaA3Ko-VYYAo3m2KqHrixmx9NLatNKd4_nP_A" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700&display=swap",
      },
    ],
    scripts: [
      { src: "https://sdk.minepi.com/pi-sdk.js" },
      {
        children: `
          (function(){
            // TEMP DEBUG: surface any JS error on screen (for Pi Browser diagnosis)
            function showError(msg){
              try{
                var box=document.getElementById('lumira-err-box');
                if(!box){
                  box=document.createElement('div');
                  box.id='lumira-err-box';
                  box.style.cssText='position:fixed;top:0;left:0;right:0;z-index:2147483647;background:rgba(180,0,0,.92);color:#fff;font:12px/1.5 monospace;padding:10px 14px;max-height:45vh;overflow:auto;direction:ltr;text-align:left;white-space:pre-wrap;word-break:break-all';
                  document.documentElement.appendChild(box);
                }
                box.textContent+=(box.textContent?'\\n---\\n':'')+msg;
              }catch(e){}
            }
            window.onerror=function(message,source,lineno,colno,error){
              showError('JS Error: '+message+'\\n'+(source||'')+':'+lineno+':'+colno+(error&&error.stack?'\\n'+error.stack:''));
            };
            window.addEventListener('unhandledrejection',function(ev){
              var r=ev&&ev.reason;
              showError('Unhandled rejection: '+(r&&r.stack?r.stack:String(r)));
            });

            function hideLoader(){
              var el=document.getElementById('initial-loader');
              if(!el)return;
              el.classList.add('hide');
              setTimeout(function(){el&&el.parentNode&&el.parentNode.removeChild(el)},400);
            }
            // Hide as early as possible — don't wait on Pi SDK or external scripts
            if(document.readyState!=='loading'){ setTimeout(hideLoader,50); }
            else { document.addEventListener('DOMContentLoaded',function(){ setTimeout(hideLoader,50); }); }
            // Absolute safety net
            setTimeout(hideLoader, 3000);

            // Pi SDK init — fire-and-forget, never block UI
            try {
              if (window.Pi && !window.__piInitDone) {
                window.__piInitDone = true;
                Promise.resolve(window.Pi.init({ version: "2.0", sandbox: true }))
                  .then(function(){ console.log("Pi SDK Initialized"); })
                  .catch(function(e){ console.warn("Pi SDK init failed:", e); });
              }
            } catch (e) { console.warn("Pi SDK init threw:", e); }

            // Service worker: register but DO NOT auto-reload on controllerchange
            // (that caused an infinite reload loop in Pi Browser and kept the
            // loader visible forever).
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function(){
                navigator.serviceWorker.register('/sw.js?v=v3').then(function (reg) {
                  reg.update().catch(function () {});
                  if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }).catch(function (err) { console.warn('SW registration failed:', err); });
              });
            }
          })();
        `,
      },

    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <style dangerouslySetInnerHTML={{ __html: INITIAL_LOADER_CSS }} />
      </head>
      <body>
        <div id="initial-loader" aria-hidden="true">
          <div className="ring" />
          <div className="brand">Lumira</div>
          <div className="hint">جاري التحميل…</div>
        </div>
        {children}
        <script dangerouslySetInnerHTML={{ __html: INITIAL_LOADER_HIDE_JS }} />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    const el = document.getElementById("initial-loader");
    if (!el) return;
    el.classList.add("hide");
    const t = setTimeout(() => el.parentNode?.removeChild(el), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Outlet />
      {import.meta.env.DEV && <PiDebugOverlay />}
    </>
  );
}

