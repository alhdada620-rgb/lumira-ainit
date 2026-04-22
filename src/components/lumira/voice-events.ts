// Simple cross-component bus for voice commands.
// VoiceVisualizer dispatches; feature panels subscribe.

export const VOICE_EVENT = "lumira:voice-command";

export type VoiceCommand =
  | "analyze-skin"
  | "start-mirror"
  | "stop-mirror"
  | "connect-pi-wallet"
  | "next-outfit";

export function emitVoiceCommand(command: VoiceCommand) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<VoiceCommand>(VOICE_EVENT, { detail: command }));
}

export function onVoiceCommand(handler: (command: VoiceCommand) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<VoiceCommand>).detail);
  window.addEventListener(VOICE_EVENT, listener);
  return () => window.removeEventListener(VOICE_EVENT, listener);
}
