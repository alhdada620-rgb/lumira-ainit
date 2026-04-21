// Simple cross-component bus for voice commands.
// SkinAnalysis subscribes; VoiceVisualizer dispatches.

export const VOICE_EVENT = "lumira:voice-command";

export type VoiceCommand = "analyze-skin";

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
