/** Shared look of the auth fields/buttons (docs/ui-spec/auth.md). */
export const AUTH_FIELD =
  "block h-14 w-full rounded-md border-2 border-transparent bg-black/40 px-4 font-game-body text-[22px] text-white outline-hidden placeholder:text-white/45 focus:border-lf-accent";

const TRIANGLES = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="56" fill="none" stroke="white" stroke-opacity=".14" stroke-width="2"><path d="M30 56 L70 6 L110 56Z M200 50 L235 8 L270 50Z M320 56 L350 20 L380 56Z"/></svg>',
);

export const AUTH_BUTTON_STYLE = { backgroundImage: `url("data:image/svg+xml,${TRIANGLES}")` };

export const AUTH_BUTTON =
  "block h-14 w-full cursor-pointer rounded-md bg-lf-primary font-game-display text-[19px] font-bold text-white transition-[filter] hover:brightness-110 disabled:opacity-60";
