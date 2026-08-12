---
name: Golden Hour Radio GHR-01
description: A machined split-flap time console and restrained music dock in a still golden-hour landscape.
colors:
  sunset-red: "#a9534c"
  sunset-apricot: "#dc8961"
  sunset-gold: "#efb979"
  sun-cream: "#ffe7ad"
  ridge-slate: "#696a60"
  ridge-evergreen: "#263432"
  ivory: "#f5ecdf"
  ivory-muted: "rgba(245, 236, 223, .64)"
  ink: "#171716"
  metal: "#292826"
  metal-light: "#373531"
  signal: "#d8784f"
  active: "#e0a474"
  glass: "rgba(27, 31, 30, .58)"
  glass-deep: "rgba(8,23,28,.72)"
  glass-line: "rgba(255, 246, 232, .18)"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(3.8rem,8.2vw,7.1rem)"
    fontWeight: 600
    lineHeight: 1
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontWeight: 600
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: ".61rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: ".06em"
rounded:
  console: "1.5rem"
  chamber: ".85rem"
  flap: ".32rem"
  control: ".55rem"
  dock: "1.1rem"
  icon: "50%"
spacing:
  edge: "clamp(1rem,2.2vw,1.75rem)"
  console-padding: "clamp(.8rem,1.8vw,1.4rem)"
  dock-padding: ".75rem 1rem"
components:
  time-console:
    backgroundColor: "{colors.metal}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.console}"
    padding: "{spacing.console-padding}"
    width: "min(63rem,calc(100vw - 2*var(--edge)))"
  split-flap-card:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.flap}"
  time-primary-action:
    backgroundColor: "#eee3d2"
    textColor: "#24231f"
    rounded: "{rounded.control}"
    padding: ".65rem 1rem"
  player-dock:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.dock}"
    padding: "{spacing.dock-padding}"
    width: "min(52rem,calc(100vw - 2*var(--edge)))"
---

# Design System: Golden Hour Radio GHR-01

## Overview

**Creative North Star: "The Golden-Hour Instrument Panel"**

GHR-01 turns timekeeping into a flattened, deliberate reading plane over a selected generated desert-road sunset. The mode wheel sits to the right of the enlarged clock; Timer mode adds a matching duration wheel to its left. The split-flap display and actions remain centered between them.

The sunset carries no motion. Motion belongs to meaningful mechanisms: the selected wheel position, the physical flap sequence when values change, running stopwatch/timer state, and the unchanged music player’s active states.

**Key Characteristics:**

- Enlarged centered split-flap display with side wheels for mode and timer duration.
- Barlow Condensed tabular digits paired with Manrope utility text.
- Six asymmetric CSS 3D split-flap cards with independent top/bottom materials, side pivots, and shade during flips.
- Cylindrical Clock/Stopwatch/Timer wheel operable by click, wheel/trackpad, drag/touch, and keyboard.
- Selected generated desert-road background and an unchanged, subordinate glass music dock.

## Colors

Warm sunset atmosphere meets charcoal metal, ivory markings, and a restrained amber active signal.

### Primary

- **Ink**, **Metal**, and **Metal Light:** the machined enclosure, recessed chamber, card faces, pivots, and dimensional material variation.
- **Ivory:** the flip digits, key outlines, and selected wheel label.
- **Signal** and **Active:** the narrow selection bands, running indicator, selected timer preset, and other meaningful mechanical-state signals.

### Secondary

- **Desert Road Sunset:** selected generated raster background (`assets/backgrounds/desert-road-sunset.png`), retained beneath only scrim and grain.

### Neutral

- The generated road, desert, and sky establish static environmental depth; do not reconstruct them as CSS ridges.
- **Ivory Muted:** supporting statuses, inactive wheel labels, and music metadata.
- **Glass**, **Deep Glass**, and **Glass Line:** the existing player dock and queue system.

**The Signal Is Scarce Rule.** Amber is for selection and active/running state; ivory establishes the currently readable primary content. Do not use either as general decoration.

## Typography

**Display Font:** Barlow Condensed (Arial Narrow fallback)  
**Body and Utility Font:** Manrope (system-ui fallback)

**Character:** Barlow Condensed gives the time readout a tall industrial authority with tabular numerical rhythm. Manrope keeps labels, statuses, controls, dates, and player metadata precise and quiet.

### Hierarchy

- **Display:** six `HH:MM:SS` digits in Barlow Condensed; values dominate the console.
- **Utility:** Manrope wheel entries, actions, duration values, and top-bar date/identity. Mode and status title text are intentionally absent.
- **Music Copy:** Manrope track metadata, timestamps, and queue rows, visually below the time instrument.

## Layout

The generated desert-road image fills the viewport with scrim and grain only. The time tool sits around 42% viewport height as an enlarged centered flip display with actions underneath; mode and status title text are removed. On normal screens, the mode wheel is vertically centered at the right side of the clock. Timer mode alone reveals the duration wheel, vertically centered at its left. There is no machined outer console or visible flip-chamber container.

The flip display is exactly viewport-centered on both axes. Its side wheels share the same 50% hinge/selection line: mode right, timer-only duration left. Actions are absolutely positioned below the display so they never change that centering. The top bar gives date at left and “Golden Hour Radio · GHR–01” at right; the existing dock stays horizontally centered at the bottom and Up Next stays right-sided.

The top-right identity is now a Settings trigger. It opens an anchored frosted shortcut panel with two persistent bindings: **Music** play/pause (`M` by default), and **Time tool** start/pause (`T` by default). The time shortcut is intentionally a no-op in Clock mode. On compact screens, the trigger becomes icon-only while retaining its touch target.

The time readout is an inline-size query container. Its single `--card-width` token is `min(14.8cqw, 14.2vh, 9.4rem)` on desktop and drives every card’s width, height, glyph size, and colon size; mobile applies smaller viewport-height and maximum caps without breaking the derived proportions. This roughly doubles desktop display scale while preserving a height-based fit limit. At narrow widths the side wheels narrow and the readout takes the actual central lane, retaining its exact center rather than shrinking around the controls.

## Elevation & Depth

Depth is physical CSS, not a moving scene. The open enlarged split-flap display carries its own dimension through card materials, side pivots, shading, and a display shadow; it is no longer framed by a machined outer enclosure or recessed chamber. Both side wheels use perspective, masked top/bottom fade, a center selection band, and rotated neighboring labels to suggest cylinders.

Each flip digit follows the PQINA-informed physical-panel construction. Every top, bottom, front, and back panel clips to 51% of the card height, while its glyph wrapper is 200% of that panel height and contains the complete numeral. Bottom and back glyph wrappers offset upward by `-100%`, exposing the lower half of the same full numeral rather than a separately aligned character. Front and back leaves rotate as a continuous paired 180-degree movement over 600ms: old front 0→-180° and new back -180°→0°. Dynamic shadow and highlight overlays darken and release with that fold. JavaScript updates only `.digit-glyph` text nodes, never replacing the panel nodes that own those overlays. Side pivots make the card read as hardware. With `prefers-reduced-motion`, values update directly and transitions/animations are effectively removed; wheel, keyboard, timer, stopwatch, and player remain functional.

## Shapes

The layout is intentionally flat: no broad machined outer rectangle and no visible flip chamber. Card corners remain tight (.32rem) and their horizontal hinges stay straight and dark. All display measurements derive from `--card-width`, including 1.49× card height, 1.28× glyph size, and .82× colon size; do not introduce independent card-size overrides. The mode wheel is a compact fixed masked cylinder rather than a segmented pill tab bar. Action controls are compact rounded rectangles (.55rem). The unchanged dock is broader and softer, with circular artwork and transport controls.

## Components

### GHR-01 Time Composition

One flat time composition centered exactly in the viewport: enlarged open flip readout at the center, actions absolutely below it, mode wheel right, and Timer-only duration wheel left. Both wheels align their selection/hinge line to the display’s 50% line. Do not restore mode/status title text, hint text, a machined outer casing, a visible chamber, floating tabs, or a dashboard grid.

The readout owns the responsive sizing calculation as an inline-size container. Maintain `--card-width: min(14.8cqw, 14.2vh, 9.4rem)` as the desktop fit guarantee; card height, glyph, and colon all derive from it. On compact screens retain the same formula with lower height/max caps, narrow wheels, and reserve only the actual center lane for the readout. The wheels must never push the flip display off its viewport center.

### Cylindrical Mode and Duration Wheels

The right wheel presents Clock, Stopwatch, and Timer as a three-position circular selector. Timer alone exposes a matching left duration wheel with 1/5/10/25 minute options (five minutes initially selected). Both support direct option clicks, mouse/trackpad progression, pointer drag/touch with velocity projection, and Arrow-key stepping; the mode wheel also supports Home for Clock and End for Timer. Expose listbox/option semantics, `aria-activedescendant`, selected state, visible focus, and drag cursor feedback. A real drag suppresses its following click so it cannot accidentally select an option. Do not display scroll/drag helper text.

### Shortcut Settings

The shortcut panel is an anchored Deep Glass utility surface, not a modal. Selecting either keyboard-style keycap begins recording; the next valid key plus optional Control, Alt, Shift, or Meta modifiers becomes the binding. Escape cancels recording; when not recording, Escape closes the panel and returns focus to the trigger. Reject a recorded key when it conflicts with the other binding. Ignore repeat keydown events and never fire shortcuts from input, textarea, or content-editable targets.

Bindings are validated before reading `localStorage`; malformed, missing, duplicate, or unavailable saved values fall back safely to defaults. If saving fails, the chosen binding stays active for this session and feedback says it could not persist. “Restore defaults” returns bindings to `M` and `T`, clearing stored values when possible and otherwise applying those defaults session-only.

### Asymmetric Split-Flap Readout

Render six Barlow Condensed digit units separated by colons. Each static or animated panel is clipped to 51% height and owns a 200%-height full-numeral glyph wrapper; bottom/back wrappers use `top: -100%` to expose the numeral’s lower half. The upper half uses lighter machined graphite and the lower half darker graphite; they are deliberately asymmetric. A change pairs front 0→-180° and back -180°→0° over one continuous 600ms interval, while shadow and highlight overlays follow the fold. Update only glyph wrappers in JavaScript so their persistent overlay nodes survive each value update. The output element supplies an accessible `HH:MM:SS` text alternative while decorative card markup remains hidden from assistive tech.

### Clock, Stopwatch, and Timer

- **Clock:** default local time; actions and duration wheel are hidden.
- **Stopwatch:** elapsed `HH:MM:SS`; Start/Pause toggles state; Reset returns to zero.
- **Timer:** countdown `HH:MM:SS`; Start/Pause toggles state; Reset returns to the duration-wheel selection; 1/5/10/25 minute options are available, with five minutes selected initially.

### Music Dock and Up Next

The music surface is unchanged and subordinate: frosted dock, circular record artwork, one-line metadata, seek rule, timestamps, transport controls, and a right-side Deep Glass “Up next” drawer. Preserve Route Blue active control treatment and white keyboard focus.

## Do's and Don'ts

### Do:

- **Do** keep the flip display exactly viewport-centered; align both side-wheel selection lines at its 50% hinge and absolutely position actions below.
- **Do** size every flip-card dimension from the inline-size container’s single `--card-width` token, including desktop and mobile height caps.
- **Do** narrow side wheels on mobile so the clock fills the actual center lane without losing its center.
- **Do** use Barlow Condensed for digits and Manrope for all utility and player text.
- **Do** preserve click, wheel/trackpad, drag, touch, keyboard, accessible listbox paths, and post-drag click suppression for both wheels.
- **Do** use 51%-clipped panels with a 200%-height full glyph and `-100%` lower-half offset for bottom/back faces.
- **Do** preserve panel shadow/highlight nodes while JavaScript updates glyph wrappers only.
- **Do** retain direct reduced-motion updates and the static generated background.
- **Do** keep settings anchored at the top-right trigger, with clear recording, conflict, save, and session-only feedback.
- **Do** preserve `M` for Music and `T` for active Stopwatch/Timer start-pause as defaults.

### Don't:

- **Don't** reintroduce pill tabs or segmented button navigation for the modes.
- **Don't** flatten the flip cards into uniform digital tiles or independently crop/retype lower numerals; retain paired 180° motion, shared full glyphs, pivots, shade, and hinge logic.
- **Don't** use independent responsive values for card height, glyphs, or colons; they must derive from `--card-width`.
- **Don't** add WebGL, video, animated scenery, or ornamental motion unrelated to state.
- **Don't** restore mode/status or scroll/drag hint text, CSS sunset/ridge construction, machined outer console, or visible flip chamber; do not let the music dock compete with the timepiece.
- **Don't** execute shortcuts on held-key repeats, inside text-entry controls, or while a shortcut recording is unresolved.
