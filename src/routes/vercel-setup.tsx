import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Download, Lock, Globe } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/vercel-setup")({
  component: VercelSetupPage,
  head: () => ({
    meta: [
      { title: "Vercel Setup · Lumira" },
      { name: "description", content: "Auto-generated Vercel environment variables for Supabase (Preview & Production)." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type EnvVar = {
  name: string;
  value: string;
  scope: "client" | "server";
  secret?: boolean;
  note?: string;
};

function VercelSetupPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const supabaseUrl =
    (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
  const supabasePublishableKey =
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ?? "";
  const supabaseProjectId =
    (import.meta.env.VITE_SUPABASE_PROJECT_ID as string) ?? "";

  const vars: EnvVar[] = useMemo(
    () => [
      { name: "VITE_SUPABASE_URL", value: supabaseUrl, scope: "client" },
      { name: "VITE_SUPABASE_PUBLISHABLE_KEY", value: supabasePublishableKey, scope: "client" },
      { name: "VITE_SUPABASE_PROJECT_ID", value: supabaseProjectId, scope: "client" },
      { name: "SUPABASE_URL", value: supabaseUrl, scope: "server" },
      { name: "SUPABASE_PUBLISHABLE_KEY", value: supabasePublishableKey, scope: "server" },
      {
        name: "SUPABASE_SERVICE_ROLE_KEY",
        value: "",
        scope: "server",
        secret: true,
        note: "Copy from Lovable Cloud → Settings → API. Never expose to the client.",
      },
      {
        name: "LOVABLE_API_KEY",
        value: "",
        scope: "server",
        secret: true,
        note: "Required if using Lovable AI Gateway. Copy from Lovable Cloud.",
      },
      {
        name: "PI_API_KEY",
        value: "",
        scope: "server",
        secret: true,
        note: "Required for Pi Network payments. Copy from Pi Developer Portal.",
      },
    ],
    [supabaseUrl, supabasePublishableKey, supabaseProjectId]
  );

  const copy = async (key: string, value: string) => {
    if (!value) {
      toast.error("This value must be filled in manually (secret).");
      return;
    }
    await navigator.clipboard.writeText(value);
    setCopied(key);
    toast.success(`Copied ${key}`);
    setTimeout(() => setCopied(null), 1500);
  };

  const envFile = useMemo(
    () =>
      vars
        .map((v) => `${v.name}=${v.value || `<paste_${v.name.toLowerCase()}_here>`}`)
        .join("\n"),
    [vars]
  );

  const copyAll = async () => {
    await navigator.clipboard.writeText(envFile);
    toast.success("Copied full .env file");
  };

  const download = () => {
    const blob = new Blob([envFile], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".env.vercel";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8 md:px-8 md:py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Vercel Environment Setup</h1>
          <p className="text-muted-foreground">
            Auto-generated list of variables needed to deploy this project to Vercel.
            Add each one to <strong>Settings → Environment Variables</strong> for
            both <Badge variant="secondary">Preview</Badge> and{" "}
            <Badge variant="secondary">Production</Badge>.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          <Button onClick={copyAll} variant="default">
            <Copy className="w-4 h-4 mr-2" /> Copy full .env
          </Button>
          <Button onClick={download} variant="outline">
            <Download className="w-4 h-4 mr-2" /> Download .env.vercel
          </Button>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5" /> Client variables (VITE_*)
          </h2>
          {vars
            .filter((v) => v.scope === "client")
            .map((v) => (
              <EnvRow key={v.name} v={v} copied={copied} onCopy={copy} />
            ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5" /> Server variables (secret)
          </h2>
          {vars
            .filter((v) => v.scope === "server")
            .map((v) => (
              <EnvRow key={v.name} v={v} copied={copied} onCopy={copy} />
            ))}
        </section>

        <Card className="p-4 space-y-2 border-primary/30">
          <h3 className="font-semibold">Pre-deploy checklist</h3>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>All variables added to Production + Preview + Development</li>
            <li><code>SERVICE_ROLE_KEY</code> has no <code>VITE_</code> prefix</li>
            <li>Values start with <code>eyJ...</code> (valid JWT)</li>
            <li>No quotes or trailing slashes</li>
            <li>Redeploy from Vercel after saving</li>
            <li>Supabase Auth → Site URL updated to your Vercel domain</li>
          </ul>
        </Card>
      </div>
    </main>
  );
}

function EnvRow({
  v,
  copied,
  onCopy,
}: {
  v: EnvVar;
  copied: string | null;
  onCopy: (k: string, val: string) => void;
}) {
  const isCopied = copied === v.name;
  const masked = v.secret && v.value ? "•".repeat(24) : v.value;
  const displayValue = v.value
    ? masked
    : v.secret
    ? "(set manually — secret)"
    : "(missing)";

  return (
    <Card className="p-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="font-mono text-sm font-semibold">{v.name}</code>
          {v.secret && (
            <Badge variant="destructive" className="text-xs">
              secret
            </Badge>
          )}
        </div>
        <div className="font-mono text-xs text-muted-foreground truncate mt-1">
          {displayValue}
        </div>
        {v.note && (
          <p className="text-xs text-muted-foreground mt-1">{v.note}</p>
        )}
      </div>
      <Button
        size="sm"
        variant={isCopied ? "default" : "outline"}
        onClick={() => onCopy(v.name, v.value)}
        disabled={!v.value}
      >
        {isCopied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </Card>
  );
}
