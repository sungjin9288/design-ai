---
title: Landing page patterns
source: refs/ui-ux-pro-max/src/ui-ux-pro-max/data/landing.csv
upstream: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
extracted_at: 2026-10-20
applies_to: [marketing, landing-page, conversion]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Landing page patterns

Battle-tested section orders for landing pages, with conversion-optimization notes. Use as scaffolding for new landing pages.


## 1. Hero + Features + CTA

**Keywords**: hero, hero-centric, hero-centric design, features, feature-rich, feature-rich showcase, cta, call-to-action

**Section order**:
- Hero with headline/image > Value prop > Key features (3-5) > CTA section > Footer

**Primary CTA placement**: Hero (sticky) + Bottom

**Color strategy**: Hero: Brand primary or vibrant. Features: Card bg #FAFAFA. CTA: Contrasting accent color

**Recommended effects**: Hero parallax, feature card hover lift, CTA glow on hover

**Conversion notes**: Deep CTA placement. For CTA label text, verify at least 4.5:1 against the button fill; use 7:1 only when the product explicitly targets AAA normal-text contrast. Keep focus and component boundaries independently visible. Disable hero parallax under reduced motion and render its static final state.


## 2. Hero + Testimonials + CTA

**Keywords**: hero, testimonials, social-proof, social-proof-focused, social proof focused, trust, reviews, cta, carousel accessibility, keyboard accessible carousel, pause auto rotation, reduced motion final state

**Section order**:
- Hero > Problem statement > Solution overview > Testimonials carousel > CTA

**Primary CTA placement**: Hero (sticky) + Post-testimonials

**Color strategy**: Hero: Brand color. Testimonials: Light bg #F5F5F5. Quotes: Italic, muted color #666. CTA: Vibrant

**Recommended effects**: Testimonial carousel slide animations, quote marks animations, avatar fade-in

**Conversion notes**: Social proof before CTA. Use a concise set of verified testimonials with photo, name, and role. CTA after social proof. Provide previous/next and pause controls; stop rotation on focus, hover, and reduced motion; announce slide position. Previous/next buttons and keyboard controls must expose every slide without dragging.


## 3. Product Demo + Features

**Keywords**: demo, product-demo, features, showcase, interactive, interactive-product-demo, interactive product demo

**Section order**:
- Hero > Product video/mockup (center) > Feature breakdown per section > Comparison (optional) > CTA

**Primary CTA placement**: Video center + CTA right/bottom

**Color strategy**: Video surround: Brand color overlay. Features: Icon color #0080FF. Text: Dark #222

**Recommended effects**: Video play button pulse, feature scroll reveals, demo interaction highlights

**Conversion notes**: Use an interactive demo only when it explains value better than static media. Provide captions, transcript, visible play/pause controls, and a non-video fallback; do not autoplay under reduced motion. Pause media when offscreen or hidden and keep the final product state available as static content.


## 4. Minimal Single Column

**Keywords**: minimal, simple, direct, minimal & direct, minimal-direct, single-column, clean

**Section order**:
- Hero headline > Short description > Benefit bullets (3 max) > CTA > Footer

**Primary CTA placement**: Center, large CTA button

**Color strategy**: Minimalist: Brand + white #FFFFFF + accent. Verify CTA label text against its button fill at 4.5:1 minimum; use 7:1 only for an explicit AAA normal-text target.

**Recommended effects**: Minimal hover effects. Smooth scroll. CTA scale on hover (subtle)

**Conversion notes**: Single CTA focus. Large typography. Lots of whitespace. No nav clutter. Mobile-first.


## 5. Funnel (3-Step Conversion)

**Keywords**: funnel, conversion, conversion-optimized, conversion optimized, steps, wizard, onboarding

**Section order**:
- Hero > Step 1 (problem) > Step 2 (solution) > Step 3 (action) > CTA progression

**Primary CTA placement**: Each step: mini-CTA. Final: main CTA

**Color strategy**: Step colors: 1 (Red/Problem), 2 (Orange/Process), 3 (Green/Solution). CTA: Brand color

**Recommended effects**: Step number animations, progress bar fill, step transitions smooth scroll

**Conversion notes**: Progressive disclosure. Show only essential info per step. Use progress indicators. Multiple CTAs.


## 6. Comparison Table + CTA

**Keywords**: comparison, table, compare, versus, cta

**Section order**:
- Hero > Problem intro > Comparison table (product vs competitors) > Pricing (optional) > CTA

**Primary CTA placement**: Table: Right column. CTA: Below table

**Color strategy**: Table: Alternating rows (white/light grey). Your product: Highlight #FFFACD (light yellow) or green. Text: Dark

**Recommended effects**: Table row hover highlight, price toggle animations, feature checkmark animations

**Conversion notes**: Use comparison to show unique value. Highlight your product row. Include 'free trial' in pricing row.


## 7. Lead Magnet + Form

**Keywords**: lead, form, signup, capture, email, magnet

**Section order**:
- Hero (benefit headline) > Lead magnet preview (ebook cover
- checklist
- etc) > Form (minimal fields) > CTA submit

**Primary CTA placement**: Form CTA: Submit button

**Color strategy**: Lead magnet: Professional design. Form: Clean white bg. Inputs: Light border #CCCCCC. CTA: Brand color

**Recommended effects**: Form focus state animations, input validation animations, success confirmation animation

**Conversion notes**: Ask only for information necessary to deliver the lead magnet. Preview its value and show submission progress.


## 8. Pricing Page + CTA

**Keywords**: pricing, plans, tiers, comparison, cta

**Section order**:
- Hero (pricing headline) > Price comparison cards > Feature comparison table > FAQ section > Final CTA

**Primary CTA placement**: Each card: CTA button. Sticky CTA in nav

**Color strategy**: Free: Grey, Starter: Blue, Pro: Green/Gold, Enterprise: Dark. Cards: 1px border, shadow

**Recommended effects**: Price toggle animation (monthly/yearly), card comparison highlight, FAQ accordion open/close

**Conversion notes**: Highlight the plan that matches the intended audience and show actual annual savings transparently. Use FAQs to address concerns.


## 9. Video-First Hero

**Keywords**: video, hero, media, visual, engaging

**Section order**:
- Hero with video background > Key features overlay > Benefits section > CTA

**Primary CTA placement**: Overlay on video (center/bottom) + Bottom section

**Color strategy**: Use an overlay strong enough for text contrast. Brand accent for CTA. Light text only when the measured contrast passes.

**Recommended effects**: Video autoplay muted, parallax scroll, text fade-in on scroll

**Conversion notes**: Use video only when it demonstrates value better than static media. Add captions for accessibility. Compress video for performance. Provide captions and a visible pause control; use a static poster when reduced motion is requested. Pause video when offscreen or hidden; the reduced-motion poster must preserve the final message and CTA.


## 10. Scroll-Triggered Storytelling

**Keywords**: storytelling, scroll, narrative, story, immersive

**Section order**:
- Intro hook > Chapter 1 (problem) > Chapter 2 (journey) > Chapter 3 (solution) > Climax CTA

**Primary CTA placement**: End of each chapter (mini) + Final climax CTA

**Color strategy**: Progressive reveal. Each chapter has distinct color. Building intensity.

**Recommended effects**: ScrollTrigger animations, parallax layers, progressive disclosure, chapter transitions

**Conversion notes**: Keep the narrative understandable without scroll-driven effects. Use progress indicator. Mobile: simplify animations. Keep DOM reading order complete; disable parallax and scroll-scrub under reduced motion. Pause scroll animation when offscreen or hidden and render each chapter in its final readable state under reduced motion.


## 11. AI Personalization Landing

**Keywords**: ai, personalization, smart, recommendation, dynamic

**Section order**:
- Dynamic hero (personalized) > Relevant features > Tailored testimonials > Smart CTA

**Primary CTA placement**: Context-aware placement based on user segment

**Color strategy**: Adaptive based on user data. A/B test color variations per segment.

**Recommended effects**: Dynamic content swap, fade transitions, personalized product recommendations

**Conversion notes**: Validate personalization with consent-aware product analytics. Requires analytics integration. Fallback for new users.


## 12. Waitlist/Coming Soon

**Keywords**: waitlist, coming-soon, launch, early-access, notify, countdown accessibility, pause animation, reduced motion final state, verified waitlist count

**Section order**:
- Hero with countdown > Product teaser/preview > Email capture form > Social proof (waitlist count)

**Primary CTA placement**: Email form prominent (above fold) + Sticky form on scroll

**Color strategy**: Anticipation: Dark + accent highlights. Countdown in brand color. Urgency indicators.

**Recommended effects**: Countdown timer animation, email validation feedback, success confetti, social share buttons

**Conversion notes**: Explain early-access benefits without fabricated scarcity. Show a waitlist count only when it is current, verified, and dated. Provide a static launch deadline, pause decorative countdown motion when offscreen/hidden, and render the final readable timer state under reduced motion. Email form and referral actions remain keyboard operable.


## 13. Comparison Table Focus

**Keywords**: comparison, table, versus, compare, features

**Section order**:
- Hero (problem statement) > Comparison matrix (you vs competitors) > Feature deep-dive > Winner CTA

**Primary CTA placement**: After comparison table (highlighted row) + Bottom

**Color strategy**: Your product column highlighted (accent bg or green). Competitors neutral. Checkmarks green.

**Recommended effects**: Table row hover highlight, feature checkmark animations, sticky comparison header

**Conversion notes**: Show value vs competitors. Measure comparison performance with product-specific analytics. Be factual. Include pricing if favorable.


## 14. Pricing-Focused Landing

**Keywords**: pricing, price, cost, plans, subscription

**Section order**:
- Hero (value proposition) > Pricing cards (3 tiers) > Feature comparison > FAQ > Final CTA

**Primary CTA placement**: Each pricing card + Sticky CTA in nav + Bottom

**Color strategy**: Popular plan highlighted (brand color border/bg). Free: grey. Enterprise: dark/premium.

**Recommended effects**: Price toggle monthly/annual animation, card hover lift, FAQ accordion smooth open

**Conversion notes**: Show actual monthly and annual totals and savings transparently. Explain plan differences and address objections in the FAQ.


## 15. App Store Style Landing

**Keywords**: app, mobile, download, store, install, carousel accessibility, keyboard accessible carousel, pause auto rotation, reduced motion final state, single pointer buttons

**Section order**:
- Hero with device mockup > Screenshots carousel > Features with icons > Reviews/ratings > Download CTAs

**Primary CTA placement**: Download buttons prominent (App Store + Play Store) throughout

**Color strategy**: Dark/light matching app store feel. Star ratings in gold. Screenshots with device frames.

**Recommended effects**: Device mockup rotations, screenshot slider, star rating animations, download button pulse

**Conversion notes**: Show real screenshots and only current verified ratings. Provide platform-specific CTAs, buttons and keyboard controls in addition to swipe, and pause any auto-rotation. Stop auto-rotation on focus, hover, offscreen/hidden, or reduced motion and render the selected screenshot as the static final state.


## 16. FAQ/Documentation Landing

**Keywords**: faq, documentation, help, support, questions, faq/documentation, knowledge base

**Section order**:
- Hero with search bar > Popular categories > FAQ accordion > Contact/support CTA

**Primary CTA placement**: Search bar prominent + Contact CTA for unresolved questions

**Color strategy**: Clean, high readability. Minimal color. Category icons in brand color. Success green for resolved.

**Recommended effects**: Search autocomplete, smooth accordion open/close, category hover, helpful feedback buttons

**Conversion notes**: Reduce support tickets. Track search analytics. Show related articles. Contact escalation path.


## 17. Immersive/Interactive Experience

**Keywords**: immersive, interactive, experience, 3d, animation, immersive/interactive experience

**Section order**:
- Full-screen interactive element > Guided product tour > Key benefits revealed > CTA after completion

**Primary CTA placement**: After interaction complete + Skip option for impatient users

**Color strategy**: Immersive experience colors. Dark background for focus. Highlight interactive elements.

**Recommended effects**: WebGL, 3D interactions, gamification elements, progress indicators, reward animations

**Conversion notes**: Measure engagement for the specific audience and device mix. Performance trade-off. Provide skip option. Mobile fallback essential. Provide skip, keyboard, reduced-motion, and non-3D fallback paths. Pause animation when offscreen/hidden and preserve the completed final state when reduced motion is enabled.


## 18. Event/Conference Landing

**Keywords**: event, conference, meetup, registration, schedule, hero-centric design, hero-centric, countdown accessibility, pause animation, reduced motion final state

**Section order**:
- Hero (date/location/countdown) > Speakers grid > Agenda/schedule > Sponsors > Register CTA

**Primary CTA placement**: Register CTA sticky + After speakers + Bottom

**Color strategy**: Urgency colors (countdown). Event branding. Speaker cards professional. Sponsor logos neutral.

**Recommended effects**: Countdown timer, speaker hover cards with bio, agenda tabs, early bird countdown

**Conversion notes**: Early bird pricing with deadline. Social proof (past attendees). Speaker credibility. Multi-ticket discounts. Expose the exact deadline as text; pause decorative countdown motion offscreen/hidden and show a static final state under reduced motion.


## 19. Product Review/Ratings Focused

**Keywords**: reviews, ratings, testimonials, social-proof, social-proof-focused, stars

**Section order**:
- Hero (product + aggregate rating) > Rating breakdown > Individual reviews > Buy/CTA

**Primary CTA placement**: After reviews summary + Buy button alongside reviews

**Color strategy**: Trust colors. Star ratings gold. Verified badge green. Review sentiment colors.

**Recommended effects**: Star fill animations, review filtering, helpful vote interactions, photo lightbox

**Conversion notes**: User-generated content builds trust. Show verified purchases. Filter by rating. Respond to negative reviews.


## 20. Community/Forum Landing

**Keywords**: community, forum, social, members, discussion, verified member count, live update accessibility, pause updates, reduced motion final state

**Section order**:
- Hero (community value prop) > Popular topics/categories > Active members showcase > Join CTA

**Primary CTA placement**: Join button prominent + After member showcase

**Color strategy**: Warm, welcoming. Member photos add humanity. Topic badges in brand colors. Activity indicators green.

**Recommended effects**: Member avatars animation, activity feed live updates, topic hover previews, join success celebration

**Conversion notes**: Preview real community value and simplify onboarding. Show member and activity counts only when current, verified, and dated; label activity as live only when backed by an active real-time source. Provide pause/update-frequency controls for moving feeds, stop work offscreen/hidden, and keep a static final state under reduced motion.


## 21. Before-After Transformation

**Keywords**: before-after, transformation, results, comparison, accessible drag interaction, drag single pointer alternative, keyboard drag alternative

**Section order**:
- Hero (problem state) > Transformation slider/comparison > How it works > Results CTA

**Primary CTA placement**: After transformation reveal + Bottom

**Color strategy**: Contrast: muted/grey (before) vs vibrant/colorful (after). Success green for results.

**Recommended effects**: Slider comparison interaction, before/after reveal animations, result counters, testimonial videos

**Conversion notes**: Visual proof of value. Measure the outcome with product-specific analytics. Real results. Specific metrics. Guarantee offer. Provide arrow buttons and keyboard steps so dragging is not required. Arrow buttons and keyboard steps expose the same final before/after positions; reduced motion removes reveal animation.


## 22. Marketplace / Directory

**Keywords**: marketplace, directory, search, listing, carousel accessibility, keyboard accessible carousel, pause auto rotation, reduced motion final state, marketplace carousel, keyboard carousel controls

**Section order**:
- Hero (Search focused) > Categories > Featured Listings > Trust/Safety > CTA (Become a host/seller)

**Primary CTA placement**: Hero Search Bar + Navbar 'List your item'

**Color strategy**: Search: High contrast. Categories: Visual icons. Trust: Blue/Green.

**Recommended effects**: Search autocomplete animation, map hover pins, card carousel

**Conversion notes**: Search is the primary CTA. Reduce friction with useful suggestions. For featured-listing carousels, provide previous/next and play/pause buttons, full keyboard access, and a single-pointer alternative to swiping; stop rotation on focus, hover, offscreen/hidden, or reduced motion and render the selected listing as the static final state.


## 23. Newsletter / Content First

**Keywords**: newsletter, content, writer, blog, subscribe, minimal & direct, minimal-direct, verified subscriber count, dated social proof

**Section order**:
- Hero (Value Prop + Form) > Recent Issues/Archives > Social Proof (Subscriber count) > About Author

**Primary CTA placement**: Hero inline form + Sticky header form

**Color strategy**: Minimalist. Paper-like background. Text focus. Accent color for Subscribe.

**Recommended effects**: Text highlight animations, typewriter effect, subtle fade-in

**Conversion notes**: Keep the form to the fields actually required and link to a sample issue. Show a subscriber count only when it is current, verified, and dated; otherwise use qualitative social proof.


## 24. Webinar Registration

**Keywords**: webinar, registration, event, training, live, webinar ticker accessibility, pause ticker, verified seat availability, verified live status, reduced motion final state

**Section order**:
- Hero (Topic + Timer + Form) > What you'll learn > Speaker Bio > Urgency/Bonuses > Form (again)

**Primary CTA placement**: Hero (Right side form) + Bottom anchor

**Color strategy**: Urgency: Red/Orange. Professional: Blue/Navy. Form: High contrast white.

**Recommended effects**: Countdown timer, speaker avatar float, urgent ticker

**Conversion notes**: State the event time and timezone in text. Claim limited seats or live status only when current capacity or stream state is verified and timestamped. Provide pause/hide controls for the urgency ticker, stop it offscreen/hidden, keep controls keyboard operable, and render a static final state under reduced motion.


## 25. Enterprise Gateway

**Keywords**: enterprise, corporate, gateway, solutions, portal, trust, authority, trust & authority, carousel accessibility, keyboard accessible carousel, pause auto rotation, reduced motion final state

**Section order**:
- Hero (Video/Mission) > Solutions by Industry > Solutions by Role > Client Logos > Contact Sales

**Primary CTA placement**: Contact Sales (Primary) + Login (Secondary)

**Color strategy**: Corporate: Navy/Grey. High integrity. Conservative accents.

**Recommended effects**: Slow video background, logo carousel, tab switching for industries

**Conversion notes**: Path selection (I am a...). Mega menu navigation. Trust signals prominent. Provide pause/stop for video and rotating logos; stop on focus and reduced motion. Logo carousel controls must be keyboard operable; pause moving media offscreen/hidden and render a static final state under reduced motion.


## 26. Portfolio Grid

**Keywords**: portfolio, grid, showcase, gallery, masonry, portfolio grid + visuals

**Section order**:
- Hero (Name/Role) > Project Grid (Masonry) > About/Philosophy > Contact

**Primary CTA placement**: Project Card Hover + Footer Contact

**Color strategy**: Neutral background (let work shine). Text: Black/White. Accent: Minimal.

**Recommended effects**: Image lazy load reveal, hover overlay info, lightbox view

**Conversion notes**: Visuals first. Filter by category. Fast loading essential.


## 27. Horizontal Scroll Journey

**Keywords**: horizontal, scroll, journey, gallery, storytelling, panoramic, storytelling-driven

**Section order**:
- Intro (Vertical) > The Journey (Horizontal Track) > Detail Reveal > Vertical Footer

**Primary CTA placement**: Floating Sticky CTA or End of Horizontal Track

**Color strategy**: Continuous palette transition. Chapter colors. Progress bar #000000.

**Recommended effects**: Scroll-jacking (careful), parallax layers, horizontal slide, progress indicator

**Conversion notes**: Immersive product discovery. High engagement. Keep navigation visible. Preserve a normal vertical navigation path and disable scroll-jacking under reduced motion. Pause effects when offscreen/hidden and render every chapter in its final vertical reading state under reduced motion.


## 28. Bento Grid Showcase

**Keywords**: bento, grid, features, modular, apple-style, showcase, feature-rich showcase

**Section order**:
- Hero > Bento Grid (Key Features) > Detail Cards > Tech Specs > CTA

**Primary CTA placement**: Floating Action Button or Bottom of Grid

**Color strategy**: Card backgrounds: #F5F5F7 or Glass. Icons: Vibrant brand colors. Text: Dark.

**Recommended effects**: Hover card scale (1.02), video inside cards, tilt effect, staggered reveal

**Conversion notes**: Scannable value props. High information density without clutter. Mobile stack. Keep cards usable without hover and suppress tilt/stagger/video motion under reduced motion. Pause card media offscreen/hidden and render cards in their final readable state under reduced motion.


## 29. Interactive 3D Configurator

**Keywords**: 3d, configurator, customizer, interactive, product, interactive product demo, accessible drag interaction, drag single pointer alternative, keyboard drag alternative

**Section order**:
- Hero (Configurator) > Feature Highlight (synced) > Price/Specs > Purchase

**Primary CTA placement**: Inside Configurator UI + Sticky Bottom Bar

**Color strategy**: Neutral studio background. Product: Realistic materials. UI: Minimal overlay.

**Recommended effects**: Real-time rendering, material swap animation, camera rotate/zoom, light reflection

**Conversion notes**: Let users inspect product details before purchase. Provide buttons and keyboard controls for rotate/zoom plus a 2D/specification fallback. Named rotate/zoom buttons and keyboard controls replace drag gestures; pause rendering offscreen/hidden and preserve the chosen configuration as the reduced-motion final state.


## 30. AI-Driven Dynamic Landing

**Keywords**: ai, dynamic, personalized, adaptive, generative

**Section order**:
- Prompt/Input Hero > Generated Result Preview > How it Works > Value Prop

**Primary CTA placement**: Input Field (Hero) + 'Try it' Buttons

**Color strategy**: Adaptive to user input. Dark mode for compute feel. Neon accents.

**Recommended effects**: Typing text effects, shimmering generation loaders, morphing layouts

**Conversion notes**: Immediate value demonstration. 'Show, don't tell'. Low friction start. Disable typing, shimmer, and morphing effects when reduced motion is requested. Pause loaders offscreen/hidden and render generated content in its final state under reduced motion.


## 31. Feature-Rich Showcase

**Keywords**: feature-rich, feature-rich showcase, features, showcase, product showcase

**Section order**:
- Hero (value prop) > Feature grid/cards (4-6) > Use cases or benefits > Social proof or logos > CTA

**Primary CTA placement**: Hero (sticky) + After features + Bottom

**Color strategy**: Brand primary + card bg #FAFAFA. Feature icons accent. CTA contrasting.

**Recommended effects**: Feature card hover lift, scroll reveal, icon micro-interactions

**Conversion notes**: Clear feature hierarchy. One key message per card. Strong CTA repetition.


## 32. Hero-Centric Design

**Keywords**: hero-centric, hero-centric design, hero-first, hero above fold

**Section order**:
- Full-bleed Hero (headline + visual) > Single value prop strip > Key benefit or proof > Primary CTA

**Primary CTA placement**: Hero dominant (center/bottom) + Sticky nav CTA

**Color strategy**: Hero: High-impact visual. Minimal text. Verify CTA label text against the button fill at 4.5:1 minimum; use 7:1 only for an explicit AAA normal-text target.

**Recommended effects**: Hero parallax or video, CTA pulse on scroll, minimal chrome

**Conversion notes**: One primary CTA. Let the hero dominate the initial viewport without hiding the next content cue. Use a static hero and non-pulsing CTA when reduced motion is requested; provide video controls. Pause hero media offscreen/hidden and keep the final hero message and CTA static under reduced motion.


## 33. Trust & Authority + Conversion

**Keywords**: trust & authority, trust, authority, conversion, credibility, enterprise, carousel accessibility, keyboard accessible carousel, pause auto rotation, reduced motion final state

**Section order**:
- Hero (mission/credibility) > Proof (logos
- certs
- stats) > Solution overview > Clear CTA path

**Primary CTA placement**: Contact Sales / Get Quote (primary) + Nav

**Color strategy**: Navy/Grey corporate. Trust blue. Accent for CTA only.

**Recommended effects**: Logo carousel, stat counters, testimonial strip

**Conversion notes**: Security badges. Case studies. Transparent pricing. Low-friction form. Provide pause/stop and stop the logo carousel on focus, hover, and reduced motion. Previous/next controls provide the keyboard equivalent; pause offscreen/hidden and render a static logo set under reduced motion.


## 34. Real-Time / Operations Landing

**Keywords**: real-time, real-time monitor, operations, dashboard, telemetry, live data, live ticker accessibility, pause live updates, verified live status, reduced motion final state

**Section order**:
- Hero (product + live preview or status) > Key metrics/indicators > How it works > CTA (Start trial / Contact)

**Primary CTA placement**: Primary CTA in nav + After metrics

**Color strategy**: Dark or neutral. Status colors (green/amber/red). Data-dense but scannable.

**Recommended effects**: Live data ticker, status pulse, minimal decoration

**Conversion notes**: Offer a demo or sandbox and show trust signals. Label telemetry as live only when backed by a current source, with update time and stale state. Provide pause/hide or update-frequency controls for tickers and previews, stop offscreen/hidden work, support keyboard controls, and render a static final snapshot under reduced motion.

