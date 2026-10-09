# V2 Heebo fonts

The approved `design-reference/LifeOS-V2-Handoff/prototype.html` embeds Heebo
Version 3.100. `Heebo-Regular.ttf` is the exact decoded embedded font, with SHA256
`c3e828690d20e344b2a0c9bcd3d64b21d62d65d465c21dd6117dd33fb5fe2532`.

The reference CSS requests weights 400, 650, 700, 750 and 800, but declares only
the embedded 400 face; browser synthesis can therefore affect its bold rendering.
For reliable native loading, the other four files are static instances of the
official [Google Fonts Heebo variable font](https://github.com/google/fonts/tree/main/ofl/heebo),
also Version 3.100. Source variable-font SHA256:
`18f930b583fa8fe6b40b2f8263b7ac6afbac07adc91a12467874e7467d3ace30`.
They were instantiated with fontTools 4.66.1 at `wght=650/700/750/800` and given
unique internal family/PostScript names (`LifeOS Heebo 650`, `LifeOSHeebo-650`,
etc.) so platforms need not resolve a synthetic `fontWeight` against the regular
face. They are bundled under the accompanying SIL Open Font License, `OFL.txt`.

`src/theme/v2-fonts.ts` registers explicit Expo font aliases; the root layout waits
for them before rendering. V2 text uses those aliases on web and native. Legacy
screens retain Assistant. All five Heebo files contain the 27 Hebrew letters
(including final forms), Latin letters, digits and the Hebrew punctuation used by
the application. Assistant also contains Hebrew: the established discrepancy was
the wrong family, not evidence of missing Hebrew glyphs.

No handoff file, network font service, font-generation tool or root untracked
TypeScript configuration is needed at application runtime. Browser/native
rasterization, synthesized prototype weights versus these static weights, and
actual computed-font selection still require rendered owner/device comparison.
