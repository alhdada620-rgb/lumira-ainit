import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { PiDebugOverlay } from "@/components/lumira/PiDebugOverlay";

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
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV && <PiDebugOverlay />}
    </>
  );
}

