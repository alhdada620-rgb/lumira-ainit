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
      { title: "lumira" },
      { name: "description", content: "Lumira Health & Elegance is a smart mirror dashboard offering AI-driven beauty and health insights." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "lumira" },
      { property: "og:description", content: "Lumira Health & Elegance is a smart mirror dashboard offering AI-driven beauty and health insights." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "lumira" },
      { name: "twitter:description", content: "Lumira Health & Elegance is a smart mirror dashboard offering AI-driven beauty and health insights." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/qBiC3UTMEGMU7NGx1VCYS5AMicw1/social-images/social-1776735981793-IMG_٢٠٢٦٠٤١٧_١١٥٧١٥.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/qBiC3UTMEGMU7NGx1VCYS5AMicw1/social-images/social-1776735981793-IMG_٢٠٢٦٠٤١٧_١١٥٧١٥.webp" },
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
          window.addEventListener('load', function () {
            try {
              if (window.Pi && !window.__piInitDone) {
                window.__piInitDone = true;
                window.Pi.init({ version: "1.5", sandbox: true });
                console.log("Pi SDK Initialized");
              }
            } catch (e) { console.warn("Pi SDK init failed:", e); }

            if ('serviceWorker' in navigator) {
              var swUrl = '/sw.js?v=v3';
              navigator.serviceWorker.register(swUrl).then(function (reg) {
                reg.update().catch(function () {});
                if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                reg.addEventListener('updatefound', function () {
                  var nw = reg.installing;
                  if (!nw) return;
                  nw.addEventListener('statechange', function () {
                    if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                      nw.postMessage({ type: 'SKIP_WAITING' });
                    }
                  });
                });
              }).catch(function (err) { console.warn('SW registration failed:', err); });

              var reloaded = false;
              navigator.serviceWorker.addEventListener('controllerchange', function () {
                if (reloaded) return;
                reloaded = true;
                window.location.reload();
              });
            }
          });
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
    <html lang="en">
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
