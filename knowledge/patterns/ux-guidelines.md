---
title: UX guidelines
source: refs/ui-ux-pro-max/src/ui-ux-pro-max/data/ux-guidelines.csv
upstream: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
extracted_at: 2026-05-07
applies_to: [web, mobile, accessibility]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# UX guidelines

A catalog of common UX issues with do/don't pairs. Use as a **review checklist** before sign-off and as a learning index for new designers.

## AI Interaction

### 🔴 Disclaimer _(_All_)_

Users need to know they talk to AI

**Do**: Clearly label AI generated content
**Don't**: Present AI as human

```
// good
AI Assistant label
// bad
Fake human name without label
```

### 🟡 Streaming _(_All_)_

Waiting for full text is slow

**Do**: Stream text response token by token
**Don't**: Show loading spinner for 10s+

```
// good
Typewriter effect
// bad
Spinner until 100% complete
```

### 🟢 Feedback Loop _(_All_)_

AI needs user feedback to improve

**Do**: Thumps up/down or 'Regenerate'
**Don't**: Static output only

```
// good
Feedback component
// bad
Read-only text
```


## Accessibility

### 🔴 Color Contrast _(_All_)_

Text must be readable against background

**Do**: Minimum 4.5:1 ratio for normal text
**Don't**: Low contrast text

```
// good
#333 on white (7:1)
// bad
#999 on white (2.8:1)
```

### 🔴 Color Only _(_All_)_

Don't convey information by color alone

**Do**: Use icons/text in addition to color
**Don't**: Red/green only for error/success

```
// good
Red text + error icon
// bad
Red border only for error
```

### 🔴 Alt Text _(_All_)_

Images need text alternatives

**Do**: Descriptive alt text for meaningful images
**Don't**: Empty or missing alt attributes

```
// good
alt='Dog playing in park'
// bad
alt='' for content images
```

### 🟡 Heading Hierarchy _(_Web_)_

Screen readers use headings for navigation

**Do**: Use sequential heading levels h1-h6
**Don't**: Skip heading levels or misuse for styling

```
// good
h1 then h2 then h3
// bad
h1 then h4
```

### 🔴 ARIA Labels _(_All_)_

Interactive elements need accessible names

**Do**: Add aria-label for icon-only buttons
**Don't**: Icon buttons without labels

```
// good
aria-label='Close menu'
// bad
<button><Icon/></button>
```

### 🔴 Keyboard Navigation _(_Web_)_

All functionality accessible via keyboard

**Do**: Tab order matches visual order
**Don't**: Keyboard traps or illogical tab order

```
// good
tabIndex for custom order
// bad
Unreachable elements
```

### 🟡 Screen Reader _(_All_)_

Content should make sense when read aloud

**Do**: Use semantic HTML and ARIA properly
**Don't**: Div soup with no semantics

```
// good
<nav> <main> <article>
// bad
<div> for everything
```

### 🔴 Form Labels _(_All_)_

Inputs must have associated labels

**Do**: Use label with for attribute or wrap input
**Don't**: Placeholder-only inputs

```
// good
<label for='email'>
// bad
placeholder='Email' only
```

### 🔴 Error Messages _(_All_)_

Error messages must be announced

**Do**: Use aria-live or role=alert for errors
**Don't**: Visual-only error indication

```
// good
role='alert'
// bad
Red border only
```

### 🟡 Skip Links _(_Web_)_

Allow keyboard users to skip navigation

**Do**: Provide skip to main content link
**Don't**: No skip link on nav-heavy pages

```
// good
Skip to main content link
// bad
100 tabs to reach content
```

### 🔴 Motion Sensitivity _(_All_)_

Parallax/Scroll-jacking causes nausea

**Do**: Respect prefers-reduced-motion
**Don't**: Force scroll effects

```
// good
@media (prefers-reduced-motion)
// bad
ScrollTrigger.create()
```


## Animation

### 🔴 Excessive Motion _(_All_)_

Too many animations cause distraction and motion sickness

**Do**: Animate 1-2 key elements per view maximum
**Don't**: Animate everything that moves

```
// good
Single hero animation
// bad
animate-bounce on 5+ elements
```

### 🟡 Duration Timing _(_All_)_

Animations should feel responsive not sluggish

**Do**: Use 150-300ms for micro-interactions
**Don't**: Use animations longer than 500ms for UI

```
// good
transition-all duration-200
// bad
duration-1000
```

### 🔴 Reduced Motion _(_All_)_

Respect user's motion preferences

**Do**: Check prefers-reduced-motion media query
**Don't**: Ignore accessibility motion settings

```
// good
@media (prefers-reduced-motion: reduce)
// bad
No motion query check
```

### 🔴 Loading States _(_All_)_

Show feedback during async operations

**Do**: Use skeleton screens or spinners
**Don't**: Leave UI frozen with no feedback

```
// good
animate-pulse skeleton
// bad
Blank screen while loading
```

### 🔴 Hover vs Tap _(_All_)_

Hover effects don't work on touch devices

**Do**: Use click/tap for primary interactions
**Don't**: Rely only on hover for important actions

```
// good
onClick handler
// bad
onMouseEnter only
```

### 🟡 Continuous Animation _(_All_)_

Infinite animations are distracting

**Do**: Use for loading indicators only
**Don't**: Use for decorative elements

```
// good
animate-spin on loader
// bad
animate-bounce on icons
```

### 🟡 Transform Performance _(_Web_)_

Some CSS properties trigger expensive repaints

**Do**: Use transform and opacity for animations
**Don't**: Animate width/height/top/left properties

```
// good
transform: translateY()
// bad
top: 10px animation
```

### 🟢 Easing Functions _(_All_)_

Linear motion feels robotic

**Do**: Use ease-out for entering ease-in for exiting
**Don't**: Use linear for UI transitions

```
// good
ease-out
// bad
linear
```


## Content

### 🟡 Truncation _(_All_)_

Handle long content gracefully

**Do**: Truncate with ellipsis and expand option
**Don't**: Overflow or broken layout

```
// good
line-clamp-2 with expand
// bad
Overflow or cut off
```

### 🟢 Date Formatting _(_All_)_

Use locale-appropriate date formats

**Do**: Use relative or locale-aware dates
**Don't**: Ambiguous date formats

```
// good
2 hours ago or locale format
// bad
01/02/03
```

### 🟢 Number Formatting _(_All_)_

Format large numbers for readability

**Do**: Use thousand separators or abbreviations
**Don't**: Long unformatted numbers

```
// good
1.2K or 1,234
// bad
1234567
```

### 🟢 Placeholder Content _(_All_)_

Show realistic placeholders during dev

**Do**: Use realistic sample data
**Don't**: Lorem ipsum everywhere

```
// good
Real sample content
// bad
Lorem ipsum
```


## Data Entry

### 🟢 Bulk Actions _(_Web_)_

Editing one by one is tedious

**Do**: Allow multi-select and bulk edit
**Don't**: Single row actions only

```
// good
Checkbox column + Action bar
// bad
Repeated actions per row
```


## Feedback

### 🔴 Loading Indicators _(_All_)_

Show system status during waits

**Do**: Show spinner/skeleton for operations > 300ms
**Don't**: No feedback during loading

```
// good
Skeleton or spinner
// bad
Frozen UI
```

### 🟡 Empty States _(_All_)_

Guide users when no content exists

**Do**: Show helpful message and action
**Don't**: Blank empty screens

```
// good
No items yet. Create one!
// bad
Empty white space
```

### 🟡 Error Recovery _(_All_)_

Help users recover from errors

**Do**: Provide clear next steps
**Don't**: Error without recovery path

```
// good
Try again button + help link
// bad
Error message only
```

### 🟡 Progress Indicators _(_All_)_

Show progress for multi-step processes

**Do**: Step indicators or progress bar
**Don't**: No indication of progress

```
// good
Step 2 of 4 indicator
// bad
No step information
```

### 🟡 Toast Notifications _(_All_)_

Transient messages for non-critical info

**Do**: Auto-dismiss after 3-5 seconds
**Don't**: Toasts that never disappear

```
// good
Auto-dismiss toast
// bad
Persistent toast
```

### 🟡 Confirmation Messages _(_All_)_

Confirm successful actions

**Do**: Brief success message
**Don't**: Silent success

```
// good
Saved successfully toast
// bad
No confirmation
```


## Forms

### 🔴 Input Labels _(_All_)_

Every input needs a visible label

**Do**: Always show label above or beside input
**Don't**: Placeholder as only label

```
// good
<label>Email</label><input>
// bad
placeholder='Email' only
```

### 🟡 Error Placement _(_All_)_

Errors should appear near the problem

**Do**: Show error below related input
**Don't**: Single error message at top of form

```
// good
Error under each field
// bad
All errors at form top
```

### 🟡 Inline Validation _(_All_)_

Validate as user types or on blur

**Do**: Validate on blur for most fields
**Don't**: Validate only on submit

```
// good
onBlur validation
// bad
Submit-only validation
```

### 🟡 Input Types _(_All_)_

Use appropriate input types

**Do**: Use email tel number url etc
**Don't**: Text input for everything

```
// good
type='email'
// bad
type='text' for email
```

### 🟡 Autofill Support _(_Web_)_

Help browsers autofill correctly

**Do**: Use autocomplete attribute properly
**Don't**: Block or ignore autofill

```
// good
autocomplete='email'
// bad
autocomplete='off' everywhere
```

### 🟡 Required Indicators _(_All_)_

Mark required fields clearly

**Do**: Use asterisk or (required) text
**Don't**: No indication of required fields

```
// good
* required indicator
// bad
Guess which are required
```

### 🟡 Password Visibility _(_All_)_

Let users see password while typing

**Do**: Toggle to show/hide password
**Don't**: No visibility toggle

```
// good
Show/hide password button
// bad
Password always hidden
```

### 🔴 Submit Feedback _(_All_)_

Confirm form submission status

**Do**: Show loading then success/error state
**Don't**: No feedback after submit

```
// good
Loading -> Success message
// bad
Button click with no response
```

### 🟡 Input Affordance _(_All_)_

Inputs should look interactive

**Do**: Use distinct input styling
**Don't**: Inputs that look like plain text

```
// good
Border/background on inputs
// bad
Borderless inputs
```

### 🟡 Mobile Keyboards _(_Mobile_)_

Show appropriate keyboard for input type

**Do**: Use inputmode attribute
**Don't**: Default keyboard for all inputs

```
// good
inputmode='numeric'
// bad
Text keyboard for numbers
```


## Interaction

### 🔴 Focus States _(_All_)_

Keyboard users need visible focus indicators

**Do**: Use visible focus rings on interactive elements
**Don't**: Remove focus outline without replacement

```
// good
focus:ring-2 focus:ring-blue-500
// bad
outline-none without alternative
```

### 🟡 Hover States _(_Web_)_

Visual feedback on interactive elements

**Do**: Change cursor and add subtle visual change
**Don't**: No hover feedback on clickable elements

```
// good
hover:bg-gray-100 cursor-pointer
// bad
No hover style
```

### 🟡 Active States _(_All_)_

Show immediate feedback on press/click

**Do**: Add pressed/active state visual change
**Don't**: No feedback during interaction

```
// good
active:scale-95
// bad
No active state
```

### 🟡 Disabled States _(_All_)_

Clearly indicate non-interactive elements

**Do**: Reduce opacity and change cursor
**Don't**: Confuse disabled with normal state

```
// good
opacity-50 cursor-not-allowed
// bad
Same style as enabled
```

### 🔴 Loading Buttons _(_All_)_

Prevent double submission during async actions

**Do**: Disable button and show loading state
**Don't**: Allow multiple clicks during processing

```
// good
disabled={loading} spinner
// bad
Button clickable while loading
```

### 🔴 Error Feedback _(_All_)_

Users need to know when something fails

**Do**: Show clear error messages near problem
**Don't**: Silent failures with no feedback

```
// good
Red border + error message
// bad
No indication of error
```

### 🟡 Success Feedback _(_All_)_

Confirm successful actions to users

**Do**: Show success message or visual change
**Don't**: No confirmation of completed action

```
// good
Toast notification or checkmark
// bad
Action completes silently
```

### 🔴 Confirmation Dialogs _(_All_)_

Prevent accidental destructive actions

**Do**: Confirm before delete/irreversible actions
**Don't**: Delete without confirmation

```
// good
Are you sure modal
// bad
Direct delete on click
```


## Layout

### 🔴 Z-Index Management _(_Web_)_

Stacking context conflicts cause hidden elements

**Do**: Define z-index scale system (10 20 30 50)
**Don't**: Use arbitrary large z-index values

```
// good
z-10 z-20 z-50
// bad
z-[9999]
```

### 🟡 Overflow Hidden _(_Web_)_

Hidden overflow can clip important content

**Do**: Test all content fits within containers
**Don't**: Blindly apply overflow-hidden

```
// good
overflow-auto with scroll
// bad
overflow-hidden truncating content
```

### 🟡 Fixed Positioning _(_Web_)_

Fixed elements can overlap or be inaccessible

**Do**: Account for safe areas and other fixed elements
**Don't**: Stack multiple fixed elements carelessly

```
// good
Fixed nav + fixed bottom with gap
// bad
Multiple overlapping fixed elements
```

### 🟡 Stacking Context _(_Web_)_

New stacking contexts reset z-index

**Do**: Understand what creates new stacking context
**Don't**: Expect z-index to work across contexts

```
// good
Parent with z-index isolates children
// bad
z-index: 9999 not working
```

### 🔴 Content Jumping _(_Web_)_

Layout shift when content loads is jarring

**Do**: Reserve space for async content
**Don't**: Let images/content push layout around

```
// good
aspect-ratio or fixed height
// bad
No dimensions on images
```

### 🟡 Viewport Units _(_Web_)_

100vh can be problematic on mobile browsers

**Do**: Use dvh or account for mobile browser chrome
**Don't**: Use 100vh for full-screen mobile layouts

```
// good
min-h-dvh or min-h-screen
// bad
h-screen on mobile
```

### 🟡 Container Width _(_Web_)_

Content too wide is hard to read

**Do**: Limit max-width for text content (65-75ch)
**Don't**: Let text span full viewport width

```
// good
max-w-prose or max-w-3xl
// bad
Full width paragraphs
```


## Navigation

### 🔴 Smooth Scroll _(_Web_)_

Anchor links should scroll smoothly to target section

**Do**: Use scroll-behavior: smooth on html element
**Don't**: Jump directly without transition

```
// good
html { scroll-behavior: smooth; }
// bad
<a href='#section'> without CSS
```

### 🟡 Sticky Navigation _(_Web_)_

Fixed nav should not obscure content

**Do**: Add padding-top to body equal to nav height
**Don't**: Let nav overlap first section content

```
// good
pt-20 (if nav is h-20)
// bad
No padding compensation
```

### 🟡 Active State _(_All_)_

Current page/section should be visually indicated

**Do**: Highlight active nav item with color/underline
**Don't**: No visual feedback on current location

```
// good
text-primary border-b-2
// bad
All links same style
```

### 🔴 Back Button _(_Mobile_)_

Users expect back to work predictably

**Do**: Preserve navigation history properly
**Don't**: Break browser/app back button behavior

```
// good
history.pushState()
// bad
location.replace()
```

### 🟡 Deep Linking _(_All_)_

URLs should reflect current state for sharing

**Do**: Update URL on state/view changes
**Don't**: Static URLs for dynamic content

```
// good
Use query params or hash
// bad
Single URL for all states
```

### 🟢 Breadcrumbs _(_Web_)_

Show user location in site hierarchy

**Do**: Use for sites with 3+ levels of depth
**Don't**: Use for flat single-level sites

```
// good
Home > Category > Product
// bad
Only on deep nested pages
```


## Onboarding

### 🟡 User Freedom _(_All_)_

Users should be able to skip tutorials

**Do**: Provide Skip and Back buttons
**Don't**: Force linear unskippable tour

```
// good
Skip Tutorial button
// bad
Locked overlay until finished
```


## Performance

### 🔴 Image Optimization _(_All_)_

Large images slow page load

**Do**: Use appropriate size and format (WebP)
**Don't**: Unoptimized full-size images

```
// good
srcset with multiple sizes
// bad
4000px image for 400px display
```

### 🟡 Lazy Loading _(_All_)_

Load content as needed

**Do**: Lazy load below-fold images and content
**Don't**: Load everything upfront

```
// good
loading='lazy'
// bad
All images eager load
```

### 🟡 Code Splitting _(_Web_)_

Large bundles slow initial load

**Do**: Split code by route/feature
**Don't**: Single large bundle

```
// good
dynamic import()
// bad
All code in main bundle
```

### 🟡 Caching _(_Web_)_

Repeat visits should be fast

**Do**: Set appropriate cache headers
**Don't**: No caching strategy

```
// good
Cache-Control headers
// bad
Every request hits server
```

### 🟡 Font Loading _(_Web_)_

Web fonts can block rendering

**Do**: Use font-display swap or optional
**Don't**: Invisible text during font load

```
// good
font-display: swap
// bad
FOIT (Flash of Invisible Text)
```

### 🟡 Third Party Scripts _(_Web_)_

External scripts can block rendering

**Do**: Load non-critical scripts async/defer
**Don't**: Synchronous third-party scripts

```
// good
async or defer attribute
// bad
<script src='...'> in head
```

### 🟡 Bundle Size _(_Web_)_

Large JavaScript slows interaction

**Do**: Monitor and minimize bundle size
**Don't**: Ignore bundle size growth

```
// good
Bundle analyzer
// bad
No size monitoring
```

### 🟡 Render Blocking _(_Web_)_

CSS/JS can block first paint

**Do**: Inline critical CSS defer non-critical
**Don't**: Large blocking CSS files

```
// good
Critical CSS inline
// bad
All CSS in head
```


## Responsive

### 🟡 Mobile First _(_Web_)_

Design for mobile then enhance for larger

**Do**: Start with mobile styles then add breakpoints
**Don't**: Desktop-first causing mobile issues

```
// good
Default mobile + md: lg: xl:
// bad
Desktop default + max-width queries
```

### 🟡 Breakpoint Testing _(_Web_)_

Test at all common screen sizes

**Do**: Test at 320 375 414 768 1024 1440
**Don't**: Only test on your device

```
// good
Multiple device testing
// bad
Single device development
```

### 🔴 Touch Friendly _(_Web_)_

Mobile layouts need touch-sized targets

**Do**: Increase touch targets on mobile
**Don't**: Same tiny buttons on mobile

```
// good
Larger buttons on mobile
// bad
Desktop-sized targets on mobile
```

### 🔴 Readable Font Size _(_All_)_

Text must be readable on all devices

**Do**: Minimum 16px body text on mobile
**Don't**: Tiny text on mobile

```
// good
text-base or larger
// bad
text-xs for body text
```

### 🔴 Viewport Meta _(_Web_)_

Set viewport for mobile devices

**Do**: Use width=device-width initial-scale=1
**Don't**: Missing or incorrect viewport

```
// good
<meta name='viewport'...>
// bad
No viewport meta tag
```

### 🔴 Horizontal Scroll _(_Web_)_

Avoid horizontal scrolling

**Do**: Ensure content fits viewport width
**Don't**: Content wider than viewport

```
// good
max-w-full overflow-x-hidden
// bad
Horizontal scrollbar on mobile
```

### 🟡 Image Scaling _(_Web_)_

Images should scale with container

**Do**: Use max-width: 100% on images
**Don't**: Fixed width images overflow

```
// good
max-w-full h-auto
// bad
width='800' fixed
```

### 🟡 Table Handling _(_Web_)_

Tables can overflow on mobile

**Do**: Use horizontal scroll or card layout
**Don't**: Wide tables breaking layout

```
// good
overflow-x-auto wrapper
// bad
Table overflows viewport
```


## Search

### 🟡 Autocomplete _(_Web_)_

Help users find results faster

**Do**: Show predictions as user types
**Don't**: Require full type and enter

```
// good
Debounced fetch + dropdown
// bad
No suggestions
```

### 🟡 No Results _(_Web_)_

Dead ends frustrate users

**Do**: Show 'No results' with suggestions
**Don't**: Blank screen or '0 results'

```
// good
Try searching for X instead
// bad
No results found.
```


## Spatial UI

### 🔴 Gaze Hover _(_VisionOS_)_

Elements should respond to eye tracking before pinch

**Do**: Scale/highlight element on look
**Don't**: Static element until pinch

```
// good
hoverEffect()
// bad
onTap only
```

### 🟡 Depth Layering _(_VisionOS_)_

UI needs Z-depth to separate content from environment

**Do**: Use glass material and z-offset
**Don't**: Flat opaque panels blocking view

```
// good
.glassBackgroundEffect()
// bad
bg-white
```


## Sustainability

### 🟡 Auto-Play Video _(_Web_)_

Video consumes massive data and energy

**Do**: Click-to-play or pause when off-screen
**Don't**: Auto-play high-res video loops

```
// good
playsInline muted preload='none'
// bad
autoplay loop
```

### 🟡 Asset Weight _(_Web_)_

Heavy 3D/Image assets increase carbon footprint

**Do**: Compress and lazy load 3D models
**Don't**: Load 50MB textures

```
// good
Draco compression
// bad
Raw .obj files
```


## Touch

### 🔴 Touch Target Size _(_Mobile_)_

Small buttons are hard to tap accurately

**Do**: Minimum 44x44px touch targets
**Don't**: Tiny clickable areas

```
// good
min-h-[44px] min-w-[44px]
// bad
w-6 h-6 buttons
```

### 🟡 Touch Spacing _(_Mobile_)_

Adjacent touch targets need adequate spacing

**Do**: Minimum 8px gap between touch targets
**Don't**: Tightly packed clickable elements

```
// good
gap-2 between buttons
// bad
gap-0 or gap-1
```

### 🟡 Gesture Conflicts _(_Mobile_)_

Custom gestures can conflict with system

**Do**: Avoid horizontal swipe on main content
**Don't**: Override system gestures

```
// good
Vertical scroll primary
// bad
Horizontal swipe carousel only
```

### 🟡 Tap Delay _(_Mobile_)_

300ms tap delay feels laggy

**Do**: Use touch-action CSS or fastclick
**Don't**: Default mobile tap handling

```
// good
touch-action: manipulation
// bad
No touch optimization
```

### 🟢 Pull to Refresh _(_Mobile_)_

Accidental refresh is frustrating

**Do**: Disable where not needed
**Don't**: Enable by default everywhere

```
// good
overscroll-behavior: contain
// bad
Default overscroll
```

### 🟢 Haptic Feedback _(_Mobile_)_

Tactile feedback improves interaction feel

**Do**: Use for confirmations and important actions
**Don't**: Overuse vibration feedback

```
// good
navigator.vibrate(10)
// bad
Vibrate on every tap
```


## Typography

### 🟡 Line Height _(_All_)_

Adequate line height improves readability

**Do**: Use 1.5-1.75 for body text
**Don't**: Cramped or excessive line height

```
// good
leading-relaxed (1.625)
// bad
leading-none (1)
```

### 🟡 Line Length _(_Web_)_

Long lines are hard to read

**Do**: Limit to 65-75 characters per line
**Don't**: Full-width text on large screens

```
// good
max-w-prose
// bad
Full viewport width text
```

### 🟡 Font Size Scale _(_All_)_

Consistent type hierarchy aids scanning

**Do**: Use consistent modular scale
**Don't**: Random font sizes

```
// good
Type scale (12 14 16 18 24 32)
// bad
Arbitrary sizes
```

### 🟡 Font Loading _(_Web_)_

Fonts should load without layout shift

**Do**: Reserve space with fallback font
**Don't**: Layout shift when fonts load

```
// good
font-display: swap + similar fallback
// bad
No fallback font
```

### 🔴 Contrast Readability _(_All_)_

Body text needs good contrast

**Do**: Use darker text on light backgrounds
**Don't**: Gray text on gray background

```
// good
text-gray-900 on white
// bad
text-gray-400 on gray-100
```

### 🟡 Heading Clarity _(_All_)_

Headings should stand out from body

**Do**: Clear size/weight difference
**Don't**: Headings similar to body text

```
// good
Bold + larger size
// bad
Same size as body
```

