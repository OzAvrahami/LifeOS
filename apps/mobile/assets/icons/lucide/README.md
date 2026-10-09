# V2 reference icons

These eighteen SVGs use the actual node geometry from the Lucide v1.8.0 script embedded
in the approved `design-reference/LifeOS-V2-Handoff/prototype.html`: Sun,
CalendarDays, Plus, ListTodo, Calendar, Sparkles, Check and User. The first seven
match the corresponding reference controls; User is the unnamed-account fallback.
Settings adds UserRound, Bell, SunMoon, ChevronLeft, ChevronDown, ArrowRight,
Volume2, Vibrate, Clock3 and LogOut from the same embedded script.
The SVG view box is 24 by 24, with no fill, a 2-unit stroke and round caps/joins.
The upstream [Lucide license](https://github.com/lucide-icons/lucide/blob/main/LICENSE)
is included in `LICENSE`.

Each transparent 96 by 96 PNG was rendered from its companion SVG with
`@resvg/resvg-js`, outside the workspace. `src/components/v2-icon.tsx` uses native
React Native Images at the reference's logical sizes and applies the theme color
through `tintColor`. This keeps the reference geometry without adding a native
module or changing dependencies. The SVG masters remain available for inspection.

The application does not execute the prototype's script or depend on its untracked
handoff directory. Icon rasterization at browser/device scale remains part of
rendered acceptance, not a claim established by source inspection.
