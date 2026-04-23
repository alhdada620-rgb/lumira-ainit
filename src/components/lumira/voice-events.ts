// Cross-component bus for voice/preset commands AND their execution results.
// VoiceVisualizer dispatches commands; feature panels report success/failure.

export const VOICE_EVENT = "lumira:voice-command";
export const RESULT_EVENT = "lumira:command-result";

export type VoiceCommand =
  | "analyze-skin"
  | "start-mirror"
  | "stop-mirror"
  | "connect-pi-wallet"
  | "next-outfit"
  | "try-on-item";

export interface TryOnPayload {
  id: string;
  name: string;
  brand: string;
  category: string;
  gradient: string;
  tag: string;
}

export type CommandStatus = "success" | "error";
export type CommandSource = "voice" | "tap";

export interface CommandResult {
  command: VoiceCommand;
  status: CommandStatus;
  source: CommandSource;
  message?: string;
  ts: number;
}

// ----- Commands -----

export function emitVoiceCommand(command: VoiceCommand, source: CommandSource = "tap") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<{ command: VoiceCommand; source: CommandSource }>(VOICE_EVENT, {
      detail: { command, source },
    }),
  );
}

export const TRYON_EVENT = "lumira:tryon-item";

export function emitTryOnItem(item: TryOnPayload, source: CommandSource = "tap") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<{ item: TryOnPayload; source: CommandSource }>(TRYON_EVENT, {
      detail: { item, source },
    }),
  );
}

export function onTryOnItem(
  handler: (item: TryOnPayload, source: CommandSource) => void,
) {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<{ item: TryOnPayload; source: CommandSource }>).detail;
    handler(detail.item, detail.source);
  };
  window.addEventListener(TRYON_EVENT, listener);
  return () => window.removeEventListener(TRYON_EVENT, listener);
}

export function onVoiceCommand(
  handler: (command: VoiceCommand, source: CommandSource) => void,
) {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<{ command: VoiceCommand; source: CommandSource }>).detail;
    handler(detail.command, detail.source);
  };
  window.addEventListener(VOICE_EVENT, listener);
  return () => window.removeEventListener(VOICE_EVENT, listener);
}

// ----- Results -----

export function reportCommandResult(result: Omit<CommandResult, "ts">) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CommandResult>(RESULT_EVENT, {
      detail: { ...result, ts: Date.now() },
    }),
  );
}

export function onCommandResult(handler: (result: CommandResult) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<CommandResult>).detail);
  window.addEventListener(RESULT_EVENT, listener);
  return () => window.removeEventListener(RESULT_EVENT, listener);
}
