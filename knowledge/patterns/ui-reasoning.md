---
title: UI category decision rules
source: refs/ui-ux-pro-max/src/ui-ux-pro-max/data/ui-reasoning.csv
upstream: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
extracted_at: 2026-05-07
applies_to: [art-direction, ui-design]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# UI category decision rules

For each product category, an opinionated recommendation: layout pattern, visual style, color mood, typography mood, motion, and the anti-patterns to avoid. Use as a starting point — adjust to brand.


## 🔴 1. SaaS (General)

- **Recommended pattern**: Hero + Features + CTA
- **Style priority**: Glassmorphism + Flat Design
- **Color mood**: Trust blue + Accent contrast
- **Typography mood**: Professional + Hierarchy
- **Key effects**: Subtle hover (200-250ms) + Smooth transitions
- **Anti-patterns**: Excessive animation + Dark mode by default
- **Decision rules**:
  - `if_ux_focused` → `prioritize-minimalism`
  - `if_data_heavy` → `add-glassmorphism`

## 🔴 2. Micro SaaS

- **Recommended pattern**: Hero-Centric + Trust
- **Style priority**: Motion-Driven + Vibrant & Block
- **Color mood**: Bold primaries + Accent contrast
- **Typography mood**: Modern + Energetic typography
- **Key effects**: Scroll-triggered animations + Parallax
- **Anti-patterns**: Static design + No video + Poor mobile
- **Decision rules**:
  - `if_pre_launch` → `use-waitlist-pattern`
  - `if_video_ready` → `add-hero-video`

## 🔴 3. E-commerce

- **Recommended pattern**: Feature-Rich Showcase
- **Style priority**: Vibrant & Block-based
- **Color mood**: Brand primary + Success green
- **Typography mood**: Engaging + Clear hierarchy
- **Key effects**: Card hover lift (200ms) + Scale effect
- **Anti-patterns**: Flat design without depth + Text-heavy pages
- **Decision rules**:
  - `if_luxury` → `switch-to-liquid-glass`
  - `if_conversion_focused` → `add-urgency-colors`

## 🔴 4. E-commerce Luxury

- **Recommended pattern**: Feature-Rich Showcase
- **Style priority**: Liquid Glass + Glassmorphism
- **Color mood**: Premium colors + Minimal accent
- **Typography mood**: Elegant + Refined typography
- **Key effects**: Chromatic aberration + Fluid animations (400-600ms)
- **Anti-patterns**: Vibrant & Block-based + Playful colors
- **Decision rules**:
  - `if_checkout` → `emphasize-trust`
  - `if_hero_needed` → `use-3d-hyperrealism`

## 🔴 5. B2B Service

- **Recommended pattern**: Feature-Rich Showcase + Trust
- **Style priority**: Trust & Authority + Minimalism
- **Color mood**: Professional blue + Neutral grey
- **Typography mood**: Formal + Clear typography
- **Key effects**: Section transitions + Feature reveals
- **Anti-patterns**: Playful design + Hidden credentials + AI purple/pink gradients
- **Decision rules**:
  - `must_have` → `roi-messaging`

## 🔴 6. Financial Dashboard

- **Recommended pattern**: Data-Dense Dashboard
- **Style priority**: Dark Mode (OLED) + Data-Dense
- **Color mood**: Dark bg + Red/Green alerts + Trust blue
- **Typography mood**: Clear + Readable typography
- **Key effects**: Real-time number animations + Alert pulse
- **Anti-patterns**: Light mode default + Slow rendering
- **Decision rules**:
  - `must_have` → `high-contrast`

## 🔴 7. Analytics Dashboard

- **Recommended pattern**: Data-Dense + Drill-Down
- **Style priority**: Data-Dense + Heat Map
- **Color mood**: Cool→Hot gradients + Neutral grey
- **Typography mood**: Clear + Functional typography
- **Key effects**: Hover tooltips + Chart zoom + Filter animations
- **Anti-patterns**: Ornate design + No filtering
- **Decision rules**:
  - `must_have` → `data-export`
  - `if_large_dataset` → `virtualize-lists`

## 🔴 8. Healthcare App

- **Recommended pattern**: Social Proof-Focused
- **Style priority**: Neumorphism + Accessible & Ethical
- **Color mood**: Calm blue + Health green
- **Typography mood**: Readable + Large type (16px+)
- **Key effects**: Soft box-shadow + Smooth press (150ms)
- **Anti-patterns**: Bright neon colors + Motion-heavy animations + AI purple/pink gradients
- **Decision rules**:
  - `must_have` → `wcag-aaa-compliance`
  - `if_medication` → `red-alert-colors`

## 🟡 9. Educational App

- **Recommended pattern**: Feature-Rich Showcase
- **Style priority**: Claymorphism + Micro-interactions
- **Color mood**: Playful colors + Clear hierarchy
- **Typography mood**: Friendly + Engaging typography
- **Key effects**: Soft press (200ms) + Fluffy elements
- **Anti-patterns**: Dark modes + Complex jargon
- **Decision rules**:
  - `if_gamification` → `add-progress-animation`
  - `if_children` → `increase-playfulness`

## 🔴 10. Creative Agency

- **Recommended pattern**: Storytelling-Driven
- **Style priority**: Brutalism + Motion-Driven
- **Color mood**: Bold primaries + Artistic freedom
- **Typography mood**: Bold + Expressive typography
- **Key effects**: CRT scanlines + Neon glow + Glitch effects
- **Anti-patterns**: Corporate minimalism + Hidden portfolio
- **Decision rules**:
  - `must_have` → `case-studies`
  - `if_boutique` → `increase-artistic-freedom`

## 🟡 11. Portfolio/Personal

- **Recommended pattern**: Storytelling-Driven
- **Style priority**: Motion-Driven + Minimalism
- **Color mood**: Brand primary + Artistic
- **Typography mood**: Expressive + Variable typography
- **Key effects**: Parallax (3-5 layers) + Scroll-triggered reveals
- **Anti-patterns**: Corporate templates + Generic layouts
- **Decision rules**:
  - `if_creative_field` → `add-brutalism`
  - `if_minimal_portfolio` → `reduce-motion`

## 🔴 12. Gaming

- **Recommended pattern**: Feature-Rich Showcase
- **Style priority**: 3D & Hyperrealism + Retro-Futurism
- **Color mood**: Vibrant + Neon + Immersive
- **Typography mood**: Bold + Impactful typography
- **Key effects**: WebGL 3D rendering + Glitch effects
- **Anti-patterns**: Minimalist design + Static assets
- **Decision rules**:
  - `if_competitive` → `add-real-time-stats`
  - `if_casual` → `increase-playfulness`

## 🔴 13. Government/Public Service

- **Recommended pattern**: Minimal & Direct
- **Style priority**: Accessible & Ethical + Minimalism
- **Color mood**: Professional blue + High contrast
- **Typography mood**: Clear + Large typography
- **Key effects**: Clear focus rings (3-4px) + Skip links
- **Anti-patterns**: Ornate design + Low contrast + Motion effects + AI purple/pink gradients
- **Decision rules**:
  - `must_have` → `keyboard-navigation`

## 🔴 14. Fintech/Crypto

- **Recommended pattern**: Trust & Authority
- **Style priority**: Minimalism + Accessible & Ethical
- **Color mood**: Navy + Trust Blue + Gold
- **Typography mood**: Professional + Trustworthy
- **Key effects**: Smooth state transitions + Number animations
- **Anti-patterns**: Playful design + Unclear fees + AI purple/pink gradients
- **Decision rules**:
  - `must_have` → `security-first`
  - `if_dashboard` → `use-dark-mode`

## 🟡 15. Social Media App

- **Recommended pattern**: Feature-Rich Showcase
- **Style priority**: Vibrant & Block-based + Motion-Driven
- **Color mood**: Vibrant + Engagement colors
- **Typography mood**: Modern + Bold typography
- **Key effects**: Large scroll animations + Icon animations
- **Anti-patterns**: Heavy skeuomorphism + Accessibility ignored
- **Decision rules**:
  - `if_engagement_metric` → `add-motion`
  - `if_content_focused` → `minimize-chrome`

## 🔴 16. Productivity Tool

- **Recommended pattern**: Interactive Demo + Feature-Rich
- **Style priority**: Flat Design + Micro-interactions
- **Color mood**: Clear hierarchy + Functional colors
- **Typography mood**: Clean + Efficient typography
- **Key effects**: Quick actions (150ms) + Task animations
- **Anti-patterns**: Complex onboarding + Slow performance
- **Decision rules**:
  - `must_have` → `keyboard-shortcuts`
  - `if_collaboration` → `add-real-time-cursors`

## 🔴 17. Design System/Component Library

- **Recommended pattern**: Feature-Rich + Documentation
- **Style priority**: Minimalism + Accessible & Ethical
- **Color mood**: Clear hierarchy + Code-like structure
- **Typography mood**: Monospace + Clear typography
- **Key effects**: Code copy animations + Component previews
- **Anti-patterns**: Poor documentation + No live preview
- **Decision rules**:
  - `must_have` → `code-examples`

## 🔴 18. AI/Chatbot Platform

- **Recommended pattern**: Interactive Demo + Minimal
- **Style priority**: AI-Native UI + Minimalism
- **Color mood**: Neutral + AI Purple (#6366F1)
- **Typography mood**: Modern + Clear typography
- **Key effects**: Streaming text + Typing indicators + Fade-in
- **Anti-patterns**: Heavy chrome + Slow response feedback
- **Decision rules**:
  - `must_have` → `context-awareness`

## 🔴 19. NFT/Web3 Platform

- **Recommended pattern**: Feature-Rich Showcase
- **Style priority**: Cyberpunk UI + Glassmorphism
- **Color mood**: Dark + Neon + Gold (#FFD700)
- **Typography mood**: Bold + Modern typography
- **Key effects**: Wallet connect animations + Transaction feedback
- **Anti-patterns**: Light mode default + No transaction status
- **Decision rules**:
  - `must_have` → `gas-fees-display`

## 🟡 20. Creator Economy Platform

- **Recommended pattern**: Social Proof + Feature-Rich
- **Style priority**: Vibrant & Block-based + Bento Box Grid
- **Color mood**: Vibrant + Brand colors
- **Typography mood**: Modern + Bold typography
- **Key effects**: Engagement counter animations + Profile reveals
- **Anti-patterns**: Generic layout + Hidden earnings
- **Decision rules**:
  - `must_have` → `monetization-display`

## 🔴 21. Remote Work/Collaboration Tool

- **Recommended pattern**: Feature-Rich + Real-Time
- **Style priority**: Soft UI Evolution + Minimalism
- **Color mood**: Calm Blue + Neutral grey
- **Typography mood**: Clean + Readable typography
- **Key effects**: Real-time presence indicators + Notification badges
- **Anti-patterns**: Cluttered interface + No presence
- **Decision rules**:
  - `must_have` → `video-integration`

## 🔴 22. Mental Health App

- **Recommended pattern**: Social Proof-Focused
- **Style priority**: Neumorphism + Accessible & Ethical
- **Color mood**: Calm Pastels + Trust colors
- **Typography mood**: Calming + Readable typography
- **Key effects**: Soft press + Breathing animations
- **Anti-patterns**: Bright neon + Motion overload
- **Decision rules**:
  - `must_have` → `privacy-first`
  - `if_meditation` → `add-breathing-animation`

## 🟡 23. Pet Tech App

- **Recommended pattern**: Storytelling + Feature-Rich
- **Style priority**: Claymorphism + Vibrant & Block-based
- **Color mood**: Playful + Warm colors
- **Typography mood**: Friendly + Playful typography
- **Key effects**: Pet profile animations + Health tracking charts
- **Anti-patterns**: Generic design + No personality
- **Decision rules**:
  - `must_have` → `pet-profiles`
  - `if_health` → `add-vet-integration`

## 🔴 24. Smart Home/IoT Dashboard

- **Recommended pattern**: Real-Time Monitoring
- **Style priority**: Glassmorphism + Dark Mode (OLED)
- **Color mood**: Dark + Status indicator colors
- **Typography mood**: Clear + Functional typography
- **Key effects**: Device status pulse + Quick action animations
- **Anti-patterns**: Slow updates + No automation
- **Decision rules**:
  - `must_have` → `energy-monitoring`

## 🔴 25. EV/Charging Ecosystem

- **Recommended pattern**: Hero-Centric + Feature-Rich
- **Style priority**: Minimalism + Aurora UI
- **Color mood**: Electric Blue (#009CD1) + Green
- **Typography mood**: Modern + Clear typography
- **Key effects**: Range estimation animations + Map interactions
- **Anti-patterns**: Poor map UX + Hidden costs
- **Decision rules**:
  - `must_have` → `range-calculator`

## 🔴 26. Subscription Box Service

- **Recommended pattern**: Feature-Rich + Conversion
- **Style priority**: Vibrant & Block-based + Motion-Driven
- **Color mood**: Brand + Excitement colors
- **Typography mood**: Engaging + Clear typography
- **Key effects**: Unboxing reveal animations + Product carousel
- **Anti-patterns**: Confusing pricing + No unboxing preview
- **Decision rules**:
  - `must_have` → `subscription-management`

## 🔴 27. Podcast Platform

- **Recommended pattern**: Storytelling + Feature-Rich
- **Style priority**: Dark Mode (OLED) + Minimalism
- **Color mood**: Dark + Audio waveform accents
- **Typography mood**: Modern + Clear typography
- **Key effects**: Waveform visualizations + Episode transitions
- **Anti-patterns**: Poor audio player + Cluttered layout
- **Decision rules**:
  - `must_have` → `episode-discovery`

## 🔴 28. Dating App

- **Recommended pattern**: Social Proof + Feature-Rich
- **Style priority**: Vibrant & Block-based + Motion-Driven
- **Color mood**: Warm + Romantic (Pink/Red gradients)
- **Typography mood**: Modern + Friendly typography
- **Key effects**: Profile card swipe + Match animations
- **Anti-patterns**: Generic profiles + No safety
- **Decision rules**:
  - `must_have` → `safety-features`

## 🟡 29. Micro-Credentials/Badges Platform

- **Recommended pattern**: Trust & Authority + Feature
- **Style priority**: Minimalism + Flat Design
- **Color mood**: Trust Blue + Gold (#FFD700)
- **Typography mood**: Professional + Clear typography
- **Key effects**: Badge reveal animations + Progress tracking
- **Anti-patterns**: No verification + Hidden progress
- **Decision rules**:
  - `must_have` → `progress-display`

## 🔴 30. Knowledge Base/Documentation

- **Recommended pattern**: FAQ + Minimal
- **Style priority**: Minimalism + Accessible & Ethical
- **Color mood**: Clean hierarchy + Minimal color
- **Typography mood**: Clear + Readable typography
- **Key effects**: Search highlight + Smooth scrolling
- **Anti-patterns**: Poor navigation + No search
- **Decision rules**:
  - `must_have` → `version-switching`

## 🔴 31. Hyperlocal Services

- **Recommended pattern**: Conversion + Feature-Rich
- **Style priority**: Minimalism + Vibrant & Block-based
- **Color mood**: Location markers + Trust colors
- **Typography mood**: Clear + Functional typography
- **Key effects**: Map hover + Provider card reveals
- **Anti-patterns**: No map + Hidden reviews
- **Decision rules**:
  - `must_have` → `booking-system`

## 🔴 32. Beauty/Spa/Wellness Service

- **Recommended pattern**: Hero-Centric + Social Proof
- **Style priority**: Soft UI Evolution + Neumorphism
- **Color mood**: Soft pastels (Pink Sage Cream) + Gold accents
- **Typography mood**: Elegant + Calming typography
- **Key effects**: Soft shadows + Smooth transitions (200-300ms) + Gentle hover
- **Anti-patterns**: Bright neon colors + Harsh animations + Dark mode
- **Decision rules**:
  - `must_have` → `before-after-gallery`
  - `if_luxury` → `add-gold-accents`

## 🔴 33. Luxury/Premium Brand

- **Recommended pattern**: Storytelling + Feature-Rich
- **Style priority**: Liquid Glass + Glassmorphism
- **Color mood**: Black + Gold (#FFD700) + White
- **Typography mood**: Elegant + Refined typography
- **Key effects**: Slow parallax + Premium reveals (400-600ms)
- **Anti-patterns**: Cheap visuals + Fast animations
- **Decision rules**:
  - `must_have` → `storytelling`

## 🔴 34. Restaurant/Food Service

- **Recommended pattern**: Hero-Centric + Conversion
- **Style priority**: Vibrant & Block-based + Motion-Driven
- **Color mood**: Warm colors (Orange Red Brown)
- **Typography mood**: Appetizing + Clear typography
- **Key effects**: Food image reveal + Menu hover effects
- **Anti-patterns**: Low-quality imagery + Outdated hours
- **Decision rules**:
  - `must_have` → `high_quality_images`
  - `if_delivery` → `emphasize-speed`

## 🔴 35. Fitness/Gym App

- **Recommended pattern**: Feature-Rich + Data
- **Style priority**: Vibrant & Block-based + Dark Mode (OLED)
- **Color mood**: Energetic (Orange #FF6B35) + Dark bg
- **Typography mood**: Bold + Motivational typography
- **Key effects**: Progress ring animations + Achievement unlocks
- **Anti-patterns**: Static design + No gamification
- **Decision rules**:
  - `must_have` → `workout-plans`

## 🔴 36. Real Estate/Property

- **Recommended pattern**: Hero-Centric + Feature-Rich
- **Style priority**: Glassmorphism + Minimalism
- **Color mood**: Trust Blue + Gold + White
- **Typography mood**: Professional + Confident
- **Key effects**: 3D property tour zoom + Map hover
- **Anti-patterns**: Poor photos + No virtual tours
- **Decision rules**:
  - `if_luxury` → `add-3d-models`
  - `must_have` → `map-integration`

## 🔴 37. Travel/Tourism Agency

- **Recommended pattern**: Storytelling-Driven + Hero
- **Style priority**: Aurora UI + Motion-Driven
- **Color mood**: Vibrant destination + Sky Blue
- **Typography mood**: Inspirational + Engaging
- **Key effects**: Destination parallax + Itinerary animations
- **Anti-patterns**: Generic photos + Complex booking
- **Decision rules**:
  - `if_experience_focused` → `use-storytelling`
  - `must_have` → `mobile-booking`

## 🔴 38. Hotel/Hospitality

- **Recommended pattern**: Hero-Centric + Social Proof
- **Style priority**: Liquid Glass + Minimalism
- **Color mood**: Warm neutrals + Gold (#D4AF37)
- **Typography mood**: Elegant + Welcoming typography
- **Key effects**: Room gallery + Amenity reveals
- **Anti-patterns**: Poor photos + Complex booking
- **Decision rules**:
  - `must_have` → `virtual-tour`

## 🔴 39. Wedding/Event Planning

- **Recommended pattern**: Storytelling + Social Proof
- **Style priority**: Soft UI Evolution + Aurora UI
- **Color mood**: Soft Pink (#FFD6E0) + Gold + Cream
- **Typography mood**: Elegant + Romantic typography
- **Key effects**: Gallery reveals + Timeline animations
- **Anti-patterns**: Generic templates + No portfolio
- **Decision rules**:
  - `must_have` → `planning-tools`

## 🔴 40. Legal Services

- **Recommended pattern**: Trust & Authority + Minimal
- **Style priority**: Trust & Authority + Minimalism
- **Color mood**: Navy Blue (#1E3A5F) + Gold + White
- **Typography mood**: Professional + Authoritative typography
- **Key effects**: Practice area reveal + Attorney profile animations
- **Anti-patterns**: Outdated design + Hidden credentials + AI purple/pink gradients
- **Decision rules**:
  - `must_have` → `credential-display`

## 🔴 41. Insurance Platform

- **Recommended pattern**: Conversion + Trust
- **Style priority**: Trust & Authority + Flat Design
- **Color mood**: Trust Blue (#0066CC) + Green + Neutral
- **Typography mood**: Clear + Professional typography
- **Key effects**: Quote calculator animations + Policy comparison
- **Anti-patterns**: Confusing pricing + No trust signals + AI purple/pink gradients
- **Decision rules**:
  - `must_have` → `policy-comparison`

## 🔴 42. Banking/Traditional Finance

- **Recommended pattern**: Trust & Authority + Feature
- **Style priority**: Minimalism + Accessible & Ethical
- **Color mood**: Navy (#0A1628) + Trust Blue + Gold
- **Typography mood**: Professional + Trustworthy typography
- **Key effects**: Smooth number animations + Security indicators
- **Anti-patterns**: Playful design + Poor security UX + AI purple/pink gradients
- **Decision rules**:
  - `must_have` → `accessibility`

## 🔴 43. Online Course/E-learning

- **Recommended pattern**: Feature-Rich + Social Proof
- **Style priority**: Claymorphism + Vibrant & Block-based
- **Color mood**: Vibrant learning colors + Progress green
- **Typography mood**: Friendly + Engaging typography
- **Key effects**: Progress bar animations + Certificate reveals
- **Anti-patterns**: Boring design + No gamification
- **Decision rules**:
  - `must_have` → `video-player`

## 🔴 44. Non-profit/Charity

- **Recommended pattern**: Storytelling + Trust
- **Style priority**: Accessible & Ethical + Organic Biophilic
- **Color mood**: Cause-related colors + Trust + Warm
- **Typography mood**: Heartfelt + Readable typography
- **Key effects**: Impact counter animations + Story reveals
- **Anti-patterns**: No impact data + Hidden financials
- **Decision rules**:
  - `must_have` → `donation-transparency`

## 🔴 45. Music Streaming

- **Recommended pattern**: Feature-Rich Showcase
- **Style priority**: Dark Mode (OLED) + Vibrant & Block-based
- **Color mood**: Dark (#121212) + Vibrant accents + Album art colors
- **Typography mood**: Modern + Bold typography
- **Key effects**: Waveform visualization + Playlist animations
- **Anti-patterns**: Cluttered layout + Poor audio player UX
- **Decision rules**:
  - `must_have` → `audio-player-ux`
  - `if_discovery_focused` → `add-playlist-recommendations`

## 🔴 46. Video Streaming/OTT

- **Recommended pattern**: Hero-Centric + Feature-Rich
- **Style priority**: Dark Mode (OLED) + Motion-Driven
- **Color mood**: Dark bg + Poster colors + Brand accent
- **Typography mood**: Bold + Engaging typography
- **Key effects**: Video player animations + Content carousel (parallax)
- **Anti-patterns**: Static layout + Slow video player
- **Decision rules**:
  - `must_have` → `continue-watching`
  - `if_personalized` → `add-recommendations`

## 🔴 47. Job Board/Recruitment

- **Recommended pattern**: Conversion-Optimized + Feature-Rich
- **Style priority**: Flat Design + Minimalism
- **Color mood**: Professional Blue + Success Green + Neutral
- **Typography mood**: Clear + Professional typography
- **Key effects**: Search/filter animations + Application flow
- **Anti-patterns**: Outdated forms + Hidden filters
- **Decision rules**:
  - `must_have` → `advanced-search`
  - `if_salary_focused` → `highlight-compensation`

## 🔴 48. Marketplace (P2P)

- **Recommended pattern**: Feature-Rich Showcase + Social Proof
- **Style priority**: Vibrant & Block-based + Flat Design
- **Color mood**: Trust colors + Category colors + Success green
- **Typography mood**: Modern + Engaging typography
- **Key effects**: Review star animations + Listing hover effects
- **Anti-patterns**: Low trust signals + Confusing layout
- **Decision rules**:
  - `must_have` → `secure-payment`

## 🔴 49. Logistics/Delivery

- **Recommended pattern**: Feature-Rich Showcase + Real-Time
- **Style priority**: Minimalism + Flat Design
- **Color mood**: Blue (#2563EB) + Orange (tracking) + Green
- **Typography mood**: Clear + Functional typography
- **Key effects**: Real-time tracking animation + Status pulse
- **Anti-patterns**: Static tracking + No map integration + AI purple/pink gradients
- **Decision rules**:
  - `must_have` → `delivery-updates`

## 🟡 50. Agriculture/Farm Tech

- **Recommended pattern**: Feature-Rich Showcase
- **Style priority**: Organic Biophilic + Flat Design
- **Color mood**: Earth Green (#4A7C23) + Brown + Sky Blue
- **Typography mood**: Clear + Informative typography
- **Key effects**: Data visualization + Weather animations
- **Anti-patterns**: Generic design + Ignored accessibility + AI purple/pink gradients
- **Decision rules**:
  - `must_have` → `sensor-dashboard`
  - `if_crop_focused` → `add-health-indicators`

## 🔴 51. Construction/Architecture

- **Recommended pattern**: Hero-Centric + Feature-Rich
- **Style priority**: Minimalism + 3D & Hyperrealism
- **Color mood**: Grey (#4A4A4A) + Orange (safety) + Blueprint Blue
- **Typography mood**: Professional + Bold typography
- **Key effects**: 3D model viewer + Timeline animations
- **Anti-patterns**: 2D-only layouts + Poor image quality + AI purple/pink gradients
- **Decision rules**:
  - `must_have` → `project-portfolio`
  - `if_team_collaboration` → `add-real-time-updates`

## 🔴 52. Automotive/Car Dealership

- **Recommended pattern**: Hero-Centric + Feature-Rich
- **Style priority**: Motion-Driven + 3D & Hyperrealism
- **Color mood**: Brand colors + Metallic + Dark/Light
- **Typography mood**: Bold + Confident typography
- **Key effects**: 360 product view + Configurator animations
- **Anti-patterns**: Static product pages + Poor UX
- **Decision rules**:
  - `must_have` → `financing-calculator`

## 🔴 53. Photography Studio

- **Recommended pattern**: Storytelling-Driven + Hero-Centric
- **Style priority**: Motion-Driven + Minimalism
- **Color mood**: Black + White + Minimal accent
- **Typography mood**: Elegant + Minimal typography
- **Key effects**: Full-bleed gallery + Before/after reveal
- **Anti-patterns**: Heavy text + Poor image showcase
- **Decision rules**:
  - `must_have` → `portfolio-showcase`
  - `if_booking` → `add-calendar-system`

## 🟡 54. Coworking Space

- **Recommended pattern**: Hero-Centric + Feature-Rich
- **Style priority**: Vibrant & Block-based + Glassmorphism
- **Color mood**: Energetic colors + Wood tones + Brand
- **Typography mood**: Modern + Engaging typography
- **Key effects**: Space tour video + Amenity reveal animations
- **Anti-patterns**: Outdated photos + Confusing layout
- **Decision rules**:
  - `must_have` → `booking-system`

## 🔴 55. Home Services (Plumber/Electrician)

- **Recommended pattern**: Conversion-Optimized + Trust
- **Style priority**: Flat Design + Trust & Authority
- **Color mood**: Trust Blue + Safety Orange + Grey
- **Typography mood**: Professional + Clear typography
- **Key effects**: Emergency contact highlight + Service menu animations
- **Anti-patterns**: Hidden contact info + No certifications
- **Decision rules**:
  - `must_have` → `certifications-display`

## 🔴 56. Childcare/Daycare

- **Recommended pattern**: Social Proof-Focused + Trust
- **Style priority**: Claymorphism + Vibrant & Block-based
- **Color mood**: Playful pastels + Safe colors + Warm
- **Typography mood**: Friendly + Playful typography
- **Key effects**: Parent portal animations + Activity gallery reveal
- **Anti-patterns**: Generic design + Hidden safety info
- **Decision rules**:
  - `must_have` → `safety-certifications`

## 🔴 57. Senior Care/Elderly

- **Recommended pattern**: Trust & Authority + Accessible
- **Style priority**: Accessible & Ethical + Soft UI Evolution
- **Color mood**: Calm Blue + Warm neutrals + Large text
- **Typography mood**: Large + Clear typography (18px+)
- **Key effects**: Large touch targets + Clear navigation
- **Anti-patterns**: Small text + Complex navigation + AI purple/pink gradients
- **Decision rules**:
  - `must_have` → `family-portal`

## 🔴 58. Medical Clinic

- **Recommended pattern**: Trust & Authority + Conversion
- **Style priority**: Accessible & Ethical + Minimalism
- **Color mood**: Medical Blue (#0077B6) + Trust White
- **Typography mood**: Professional + Readable typography
- **Key effects**: Online booking flow + Doctor profile reveals
- **Anti-patterns**: Outdated interface + Confusing booking + AI purple/pink gradients
- **Decision rules**:
  - `must_have` → `insurance-info`

## 🔴 59. Pharmacy/Drug Store

- **Recommended pattern**: Conversion-Optimized + Trust
- **Style priority**: Flat Design + Accessible & Ethical
- **Color mood**: Pharmacy Green + Trust Blue + Clean White
- **Typography mood**: Clear + Functional typography
- **Key effects**: Prescription upload flow + Refill reminders
- **Anti-patterns**: Confusing layout + Privacy concerns + AI purple/pink gradients
- **Decision rules**:
  - `must_have` → `drug-interaction-warnings`

## 🔴 60. Dental Practice

- **Recommended pattern**: Social Proof-Focused + Conversion
- **Style priority**: Soft UI Evolution + Minimalism
- **Color mood**: Fresh Blue + White + Smile Yellow
- **Typography mood**: Friendly + Professional typography
- **Key effects**: Before/after gallery + Patient testimonial carousel
- **Anti-patterns**: Poor imagery + No testimonials
- **Decision rules**:
  - `must_have` → `appointment-system`

## 🟡 61. Veterinary Clinic

- **Recommended pattern**: Social Proof-Focused + Trust
- **Style priority**: Claymorphism + Accessible & Ethical
- **Color mood**: Caring Blue + Pet colors + Warm
- **Typography mood**: Friendly + Welcoming typography
- **Key effects**: Pet profile management + Service animations
- **Anti-patterns**: Generic design + Hidden services
- **Decision rules**:
  - `must_have` → `emergency-contact`

## 🟡 62. Florist/Plant Shop

- **Recommended pattern**: Hero-Centric + Conversion
- **Style priority**: Organic Biophilic + Vibrant & Block-based
- **Color mood**: Natural Green + Floral pinks/purples
- **Typography mood**: Elegant + Natural typography
- **Key effects**: Product reveal + Seasonal transitions
- **Anti-patterns**: Poor imagery + No seasonal content
- **Decision rules**:
  - `must_have` → `care-guides`

## 🔴 63. Bakery/Cafe

- **Recommended pattern**: Hero-Centric + Conversion
- **Style priority**: Vibrant & Block-based + Soft UI Evolution
- **Color mood**: Warm Brown + Cream + Appetizing accents
- **Typography mood**: Warm + Inviting typography
- **Key effects**: Menu hover + Order animations
- **Anti-patterns**: Poor food photos + Hidden hours
- **Decision rules**:
  - `must_have` → `online-ordering`

## 🔴 64. Brewery/Winery

- **Recommended pattern**: Storytelling + Hero-Centric
- **Style priority**: Motion-Driven + Storytelling-Driven
- **Color mood**: Deep amber/burgundy + Gold + Craft
- **Typography mood**: Artisanal + Heritage typography
- **Key effects**: Tasting note reveals + Heritage timeline
- **Anti-patterns**: Generic product pages + No story
- **Decision rules**:
  - `must_have` → `story-heritage`

## 🔴 65. Airline

- **Recommended pattern**: Conversion + Feature-Rich
- **Style priority**: Minimalism + Glassmorphism
- **Color mood**: Sky Blue + Brand colors + Trust
- **Typography mood**: Clear + Professional typography
- **Key effects**: Flight search animations + Boarding pass reveals
- **Anti-patterns**: Complex booking + Poor mobile
- **Decision rules**:
  - `must_have` → `mobile-first`

## 🔴 66. News/Media Platform

- **Recommended pattern**: Hero-Centric + Feature-Rich
- **Style priority**: Minimalism + Flat Design
- **Color mood**: Brand colors + High contrast
- **Typography mood**: Clear + Readable typography
- **Key effects**: Breaking news badge + Article reveal animations
- **Anti-patterns**: Cluttered layout + Slow loading
- **Decision rules**:
  - `must_have` → `category-navigation`

## 🔴 67. Magazine/Blog

- **Recommended pattern**: Storytelling + Hero-Centric
- **Style priority**: Swiss Modernism 2.0 + Motion-Driven
- **Color mood**: Editorial colors + Brand + Clean white
- **Typography mood**: Editorial + Elegant typography
- **Key effects**: Article transitions + Category reveals
- **Anti-patterns**: Poor typography + Slow loading
- **Decision rules**:
  - `must_have` → `newsletter-signup`

## 🔴 68. Freelancer Platform

- **Recommended pattern**: Feature-Rich + Conversion
- **Style priority**: Flat Design + Minimalism
- **Color mood**: Professional Blue + Success Green
- **Typography mood**: Clear + Professional typography
- **Key effects**: Skill match animations + Review reveals
- **Anti-patterns**: Poor profiles + No reviews
- **Decision rules**:
  - `must_have` → `skill-matching`

## 🔴 69. Marketing Agency

- **Recommended pattern**: Storytelling + Feature-Rich
- **Style priority**: Brutalism + Motion-Driven
- **Color mood**: Bold brand colors + Creative freedom
- **Typography mood**: Bold + Expressive typography
- **Key effects**: Portfolio reveals + Results animations
- **Anti-patterns**: Boring design + Hidden work
- **Decision rules**:
  - `must_have` → `results-metrics`

## 🔴 70. Event Management

- **Recommended pattern**: Hero-Centric + Feature-Rich
- **Style priority**: Vibrant & Block-based + Motion-Driven
- **Color mood**: Event theme colors + Excitement accents
- **Typography mood**: Bold + Engaging typography
- **Key effects**: Countdown timer + Registration flow
- **Anti-patterns**: Confusing registration + No countdown
- **Decision rules**:
  - `must_have` → `agenda-display`

## 🔴 71. Membership/Community

- **Recommended pattern**: Social Proof + Conversion
- **Style priority**: Vibrant & Block-based + Soft UI Evolution
- **Color mood**: Community brand colors + Engagement
- **Typography mood**: Friendly + Engaging typography
- **Key effects**: Member counter + Benefit reveals
- **Anti-patterns**: Hidden benefits + No community proof
- **Decision rules**:
  - `must_have` → `pricing-tiers`

## 🟡 72. Newsletter Platform

- **Recommended pattern**: Minimal + Conversion
- **Style priority**: Minimalism + Flat Design
- **Color mood**: Brand primary + Clean white + CTA
- **Typography mood**: Clean + Readable typography
- **Key effects**: Subscribe form + Archive reveals
- **Anti-patterns**: Complex signup + No preview
- **Decision rules**:
  - `must_have` → `sample-content`

## 🔴 73. Digital Products/Downloads

- **Recommended pattern**: Feature-Rich + Conversion
- **Style priority**: Vibrant & Block-based + Motion-Driven
- **Color mood**: Product colors + Brand + Success green
- **Typography mood**: Modern + Clear typography
- **Key effects**: Product preview + Instant delivery animations
- **Anti-patterns**: No preview + Slow delivery
- **Decision rules**:
  - `must_have` → `instant-delivery`

## 🟡 74. Church/Religious Organization

- **Recommended pattern**: Hero-Centric + Social Proof
- **Style priority**: Accessible & Ethical + Soft UI Evolution
- **Color mood**: Warm Gold + Deep Purple/Blue + White
- **Typography mood**: Welcoming + Clear typography
- **Key effects**: Service time highlights + Event calendar
- **Anti-patterns**: Outdated design + Hidden info
- **Decision rules**:
  - `must_have` → `community-events`

## 🔴 75. Sports Team/Club

- **Recommended pattern**: Hero-Centric + Feature-Rich
- **Style priority**: Vibrant & Block-based + Motion-Driven
- **Color mood**: Team colors + Energetic accents
- **Typography mood**: Bold + Impactful typography
- **Key effects**: Score animations + Schedule reveals
- **Anti-patterns**: Static content + Poor fan engagement
- **Decision rules**:
  - `must_have` → `roster`

## 🔴 76. Museum/Gallery

- **Recommended pattern**: Storytelling + Feature-Rich
- **Style priority**: Minimalism + Motion-Driven
- **Color mood**: Art-appropriate neutrals + Exhibition accents
- **Typography mood**: Elegant + Minimal typography
- **Key effects**: Virtual tour + Collection reveals
- **Anti-patterns**: Cluttered layout + No online access
- **Decision rules**:
  - `must_have` → `exhibition-info`

## 🔴 77. Theater/Cinema

- **Recommended pattern**: Hero-Centric + Conversion
- **Style priority**: Dark Mode (OLED) + Motion-Driven
- **Color mood**: Dark + Spotlight accents + Gold
- **Typography mood**: Dramatic + Bold typography
- **Key effects**: Seat selection + Trailer reveals
- **Anti-patterns**: Poor booking UX + No trailers
- **Decision rules**:
  - `must_have` → `seat-selection`

## 🔴 78. Language Learning App

- **Recommended pattern**: Feature-Rich + Social Proof
- **Style priority**: Claymorphism + Vibrant & Block-based
- **Color mood**: Playful colors + Progress indicators
- **Typography mood**: Friendly + Clear typography
- **Key effects**: Progress animations + Achievement unlocks
- **Anti-patterns**: Boring design + No motivation
- **Decision rules**:
  - `must_have` → `gamification`

## 🔴 79. Coding Bootcamp

- **Recommended pattern**: Feature-Rich + Social Proof
- **Style priority**: Dark Mode (OLED) + Minimalism
- **Color mood**: Code editor colors + Brand + Success
- **Typography mood**: Technical + Clear typography
- **Key effects**: Terminal animations + Career outcome reveals
- **Anti-patterns**: Light mode only + Hidden results
- **Decision rules**:
  - `must_have` → `career-outcomes`

## 🔴 80. Cybersecurity Platform

- **Recommended pattern**: Trust & Authority + Real-Time
- **Style priority**: Cyberpunk UI + Dark Mode (OLED)
- **Color mood**: Matrix Green (#00FF00) + Deep Black
- **Typography mood**: Technical + Clear typography
- **Key effects**: Threat visualization + Alert animations
- **Anti-patterns**: Light mode + Poor data viz
- **Decision rules**:
  - `must_have` → `threat-display`

## 🔴 81. Developer Tool / IDE

- **Recommended pattern**: Minimal + Documentation
- **Style priority**: Dark Mode (OLED) + Minimalism
- **Color mood**: Dark syntax theme + Blue focus
- **Typography mood**: Monospace + Functional typography
- **Key effects**: Syntax highlighting + Command palette
- **Anti-patterns**: Light mode default + Slow performance
- **Decision rules**:
  - `must_have` → `documentation`

## 🔴 82. Biotech / Life Sciences

- **Recommended pattern**: Storytelling + Data
- **Style priority**: Glassmorphism + Clean Science
- **Color mood**: Sterile White + DNA Blue + Life Green
- **Typography mood**: Scientific + Clear typography
- **Key effects**: Data visualization + Research reveals
- **Anti-patterns**: Cluttered data + Poor credibility
- **Decision rules**:
  - `must_have` → `clean-aesthetic`

## 🔴 83. Space Tech / Aerospace

- **Recommended pattern**: Immersive + Feature-Rich
- **Style priority**: Holographic/HUD + Dark Mode
- **Color mood**: Deep Space Black + Star White + Metallic
- **Typography mood**: Futuristic + Precise typography
- **Key effects**: Telemetry animations + 3D renders
- **Anti-patterns**: Generic design + No immersion
- **Decision rules**:
  - `must_have` → `precision-data`

## 🔴 84. Architecture / Interior

- **Recommended pattern**: Portfolio + Hero-Centric
- **Style priority**: Exaggerated Minimalism + High Imagery
- **Color mood**: Monochrome + Gold Accent + High Imagery
- **Typography mood**: Architectural + Elegant typography
- **Key effects**: Project gallery + Blueprint reveals
- **Anti-patterns**: Poor imagery + Cluttered layout
- **Decision rules**:
  - `must_have` → `project-portfolio`

## 🔴 85. Quantum Computing Interface

- **Recommended pattern**: Immersive + Interactive
- **Style priority**: Holographic/HUD + Dark Mode
- **Color mood**: Quantum Blue (#00FFFF) + Deep Black
- **Typography mood**: Futuristic + Scientific typography
- **Key effects**: Probability visualizations + Qubit state animations
- **Anti-patterns**: Generic tech design + No viz
- **Decision rules**:
  - `must_have` → `scientific-credibility`

## 🔴 86. Biohacking / Longevity App

- **Recommended pattern**: Data-Dense + Storytelling
- **Style priority**: Biomimetic/Organic 2.0 + Minimalism
- **Color mood**: Cellular Pink/Red + DNA Blue + White
- **Typography mood**: Scientific + Clear typography
- **Key effects**: Biological data viz + Progress animations
- **Anti-patterns**: Generic health app + No privacy
- **Decision rules**:
  - `must_have` → `scientific-credibility`

## 🔴 87. Autonomous Drone Fleet Manager

- **Recommended pattern**: Real-Time + Feature-Rich
- **Style priority**: HUD/Sci-Fi FUI + Real-Time
- **Color mood**: Tactical Green + Alert Red + Map Dark
- **Typography mood**: Technical + Functional typography
- **Key effects**: Telemetry animations + 3D spatial awareness
- **Anti-patterns**: Slow updates + Poor spatial viz
- **Decision rules**:
  - `must_have` → `safety-alerts`

## 🔴 88. Generative Art Platform

- **Recommended pattern**: Showcase + Feature-Rich
- **Style priority**: Minimalism + Gen Z Chaos
- **Color mood**: Neutral (#F5F5F5) + User Content
- **Typography mood**: Minimal + Content-focused typography
- **Key effects**: Gallery masonry + Minting animations
- **Anti-patterns**: Heavy chrome + Slow loading
- **Decision rules**:
  - `must_have` → `creator-attribution`

## 🔴 89. Spatial Computing OS / App

- **Recommended pattern**: Immersive + Interactive
- **Style priority**: Spatial UI (VisionOS) + Glassmorphism
- **Color mood**: Frosted Glass + System Colors + Depth
- **Typography mood**: Spatial + Readable typography
- **Key effects**: Depth hierarchy + Gaze interactions
- **Anti-patterns**: 2D design + No spatial depth
- **Decision rules**:
  - `must_have` → `environment-awareness`

## 🔴 90. Sustainable Energy / Climate Tech

- **Recommended pattern**: Data + Trust
- **Style priority**: Organic Biophilic + E-Ink/Paper
- **Color mood**: Earth Green + Sky Blue + Solar Yellow
- **Typography mood**: Clear + Informative typography
- **Key effects**: Impact viz + Progress animations
- **Anti-patterns**: Greenwashing + No real data
- **Decision rules**:
  - `must_have` → `impact-visualization`

## 🔴 91. Personal Finance Tracker

- **Recommended pattern**: Interactive Product Demo
- **Style priority**: Glassmorphism + Dark Mode (OLED)
- **Color mood**: Calm blue + success green + alert red + chart accents
- **Typography mood**: Modern + Clear hierarchy
- **Key effects**: Backdrop blur (10-20px) + Translucent overlays
- **Anti-patterns**: Pure white backgrounds
- **Decision rules**:
  - `if_light_mode_needed` → `provide-theme-toggle`
  - `if_low_performance` → `fallback-to-flat`

## 🔴 92. Chat & Messaging App

- **Recommended pattern**: Feature-Rich Showcase + Demo
- **Style priority**: Minimalism + Micro-interactions
- **Color mood**: Brand primary + bubble contrast (sender/receiver) + typing grey
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle hover 200ms + Smooth transitions + Clean
- **Anti-patterns**: Excessive decoration
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 93. Notes & Writing App

- **Recommended pattern**: Minimal & Direct
- **Style priority**: Minimalism + Flat Design
- **Color mood**: Clean white/cream + minimal accent + editor syntax colors
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Excessive decoration + Complex shadows + 3D effects
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 94. Habit Tracker

- **Recommended pattern**: Social Proof-Focused + Demo
- **Style priority**: Claymorphism + Vibrant & Block-based
- **Color mood**: Streak warm (amber/orange) + progress green + motivational accents
- **Typography mood**: Playful + Rounded + Friendly
- **Key effects**: Multi-layer shadows + Spring bounce + Soft press 200ms
- **Anti-patterns**: Muted colors + Low energy
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 95. Food Delivery / On-Demand

- **Recommended pattern**: Hero-Centric Design + Feature-Rich
- **Style priority**: Vibrant & Block-based + Motion-Driven
- **Color mood**: Appetizing warm (orange/red) + trust blue + map accent
- **Typography mood**: Energetic + Bold + Large
- **Key effects**: Scroll animations + Parallax + Page transitions
- **Anti-patterns**: Muted colors + Low energy
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 96. Ride Hailing / Transportation

- **Recommended pattern**: Conversion-Optimized + Demo
- **Style priority**: Minimalism + Glassmorphism
- **Color mood**: Brand primary + map neutral + status indicator colors
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Backdrop blur (10-20px) + Translucent overlays
- **Anti-patterns**: Excessive decoration
- **Decision rules**:
  - `if_low_performance` → `fallback-to-flat`
  - `if_conversion_focused` → `add-urgency-colors`

## 🔴 97. Recipe & Cooking App

- **Recommended pattern**: Hero-Centric Design + Feature-Rich
- **Style priority**: Claymorphism + Vibrant & Block-based
- **Color mood**: Warm food tones (terracotta/sage/cream) + appetizing imagery
- **Typography mood**: Playful + Rounded + Friendly
- **Key effects**: Multi-layer shadows + Spring bounce + Soft press 200ms
- **Anti-patterns**: Muted colors + Low energy
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 98. Meditation & Mindfulness

- **Recommended pattern**: Storytelling-Driven + Social Proof
- **Style priority**: Neumorphism + Soft UI Evolution
- **Color mood**: Ultra-calm pastels (lavender/sage/sky) + breathing animation gradient
- **Typography mood**: Subtle + Soft + Monochromatic
- **Key effects**: Dual shadows (light+dark) + Soft press 150ms
- **Anti-patterns**: Inconsistent styling + Poor contrast ratios
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 99. Weather App

- **Recommended pattern**: Hero-Centric Design
- **Style priority**: Glassmorphism + Aurora UI
- **Color mood**: Atmospheric gradients (sky blue → sunset → storm grey) + temp scale
- **Typography mood**: Modern + Clear hierarchy
- **Key effects**: Backdrop blur (10-20px) + Translucent overlays
- **Anti-patterns**: Inconsistent styling + Poor contrast ratios
- **Decision rules**:
  - `if_low_performance` → `fallback-to-flat`

## 🔴 100. Diary & Journal App

- **Recommended pattern**: Storytelling-Driven
- **Style priority**: Soft UI Evolution + Minimalism
- **Color mood**: Warm paper tones (cream/linen) + muted ink + mood-coded accents
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle hover 200ms + Smooth transitions + Clean
- **Anti-patterns**: Excessive decoration
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 101. CRM & Client Management

- **Recommended pattern**: Feature-Rich Showcase + Demo
- **Style priority**: Flat Design + Minimalism
- **Color mood**: Professional blue + pipeline stage colors + closed-won green
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Excessive decoration + Complex shadows + 3D effects
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 102. Inventory & Stock Management

- **Recommended pattern**: Feature-Rich Showcase
- **Style priority**: Flat Design + Minimalism
- **Color mood**: Functional neutral + status traffic-light (green/amber/red) + scanner accent
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Excessive decoration + Complex shadows + 3D effects
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 103. Flashcard & Study Tool

- **Recommended pattern**: Feature-Rich Showcase + Demo
- **Style priority**: Claymorphism + Micro-interactions
- **Color mood**: Playful primary + correct green + incorrect red + progress blue
- **Typography mood**: Playful + Rounded + Friendly
- **Key effects**: Multi-layer shadows + Spring bounce + Soft press 200ms
- **Anti-patterns**: Inconsistent styling + Poor contrast ratios
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 104. Booking & Appointment App

- **Recommended pattern**: Conversion-Optimized
- **Style priority**: Soft UI Evolution + Flat Design
- **Color mood**: Trust blue + available green + booked grey + confirm accent
- **Typography mood**: Bold + Clean + Sans-serif
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Complex shadows + 3D effects
- **Decision rules**:
  - `if_conversion_focused` → `add-urgency-colors`

## 🔴 105. Invoice & Billing Tool

- **Recommended pattern**: Conversion-Optimized + Trust
- **Style priority**: Minimalism + Flat Design
- **Color mood**: Professional navy + paid green + overdue red + neutral grey
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Excessive decoration + Complex shadows + 3D effects
- **Decision rules**:
  - `if_conversion_focused` → `add-urgency-colors`

## 🔴 106. Grocery & Shopping List

- **Recommended pattern**: Minimal & Direct + Demo
- **Style priority**: Flat Design + Vibrant & Block-based
- **Color mood**: Fresh green + food-category colors + checkmark accent
- **Typography mood**: Bold + Clean + Sans-serif
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Complex shadows + 3D effects + Muted colors + Low energy
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 107. Timer & Pomodoro

- **Recommended pattern**: Minimal & Direct
- **Style priority**: Minimalism + Neumorphism
- **Color mood**: High-contrast on dark + focus red/amber + break green
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Dual shadows (light+dark) + Soft press 150ms
- **Anti-patterns**: Excessive decoration
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 108. Parenting & Baby Tracker

- **Recommended pattern**: Social Proof-Focused + Trust
- **Style priority**: Claymorphism + Soft UI Evolution
- **Color mood**: Soft pastels (baby pink/sky blue/mint/peach) + warm accents
- **Typography mood**: Playful + Rounded + Friendly
- **Key effects**: Multi-layer shadows + Spring bounce + Soft press 200ms
- **Anti-patterns**: Inconsistent styling + Poor contrast ratios
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 109. Scanner & Document Manager

- **Recommended pattern**: Feature-Rich Showcase + Demo
- **Style priority**: Minimalism + Flat Design
- **Color mood**: Clean white + camera viewfinder accent + file-type color coding
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Excessive decoration + Complex shadows + 3D effects
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 110. Calendar & Scheduling App

- **Recommended pattern**: Feature-Rich Showcase + Demo
- **Style priority**: Flat Design + Micro-interactions
- **Color mood**: Clean blue + event category accent colors + success green
- **Typography mood**: Bold + Clean + Sans-serif
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Complex shadows + 3D effects
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 111. Password Manager

- **Recommended pattern**: Trust & Authority + Feature-Rich
- **Style priority**: Minimalism + Accessible & Ethical
- **Color mood**: Trust blue + security green + dark neutral
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle hover 200ms + Smooth transitions + Clean
- **Anti-patterns**: Excessive decoration + Color-only indicators
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 112. Expense Splitter / Bill Split

- **Recommended pattern**: Minimal & Direct + Demo
- **Style priority**: Flat Design + Vibrant & Block-based
- **Color mood**: Success green + alert red + neutral grey + avatar accent colors
- **Typography mood**: Bold + Clean + Sans-serif
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Complex shadows + 3D effects + Muted colors + Low energy
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 113. Voice Recorder & Memo

- **Recommended pattern**: Interactive Product Demo + Minimal
- **Style priority**: Minimalism + AI-Native UI
- **Color mood**: Clean white + recording red + waveform accent
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle hover 200ms + Smooth transitions + Clean
- **Anti-patterns**: Excessive decoration
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 114. Bookmark & Read-Later

- **Recommended pattern**: Minimal & Direct + Demo
- **Style priority**: Minimalism + Flat Design
- **Color mood**: Paper warm white + ink neutral + minimal accent + tag colors
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Excessive decoration + Complex shadows + 3D effects
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 115. Translator App

- **Recommended pattern**: Feature-Rich Showcase + Interactive Demo
- **Style priority**: Flat Design + AI-Native UI
- **Color mood**: Global blue + neutral grey + language flag accent
- **Typography mood**: Bold + Clean + Sans-serif
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Complex shadows + 3D effects
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 116. Calculator & Unit Converter

- **Recommended pattern**: Minimal & Direct
- **Style priority**: Neumorphism + Minimalism
- **Color mood**: Dark functional + orange operation keys + clear button hierarchy
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Dual shadows (light+dark) + Soft press 150ms
- **Anti-patterns**: Excessive decoration
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 117. Alarm & World Clock

- **Recommended pattern**: Minimal & Direct
- **Style priority**: Dark Mode (OLED) + Minimalism
- **Color mood**: Deep dark + ambient glow accent + timezone gradient
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle glow + Neon accents + High contrast
- **Anti-patterns**: Excessive decoration + Pure white backgrounds
- **Decision rules**:
  - `if_light_mode_needed` → `provide-theme-toggle`

## 🔴 118. File Manager & Transfer

- **Recommended pattern**: Feature-Rich Showcase + Demo
- **Style priority**: Flat Design + Minimalism
- **Color mood**: Functional neutral + file type color coding (PDF orange, doc blue, image purple)
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Excessive decoration + Complex shadows + 3D effects
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 119. Email Client

- **Recommended pattern**: Feature-Rich Showcase + Demo
- **Style priority**: Flat Design + Minimalism
- **Color mood**: Clean white + brand primary + priority red + snooze amber
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Excessive decoration + Complex shadows + 3D effects
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 120. Casual Puzzle Game

- **Recommended pattern**: Feature-Rich Showcase + Social Proof
- **Style priority**: Claymorphism + Vibrant & Block-based
- **Color mood**: Cheerful pastels + progression gradient + reward gold + bright accent
- **Typography mood**: Playful + Rounded + Friendly
- **Key effects**: Multi-layer shadows + Spring bounce + Soft press 200ms
- **Anti-patterns**: Muted colors + Low energy
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 121. Trivia & Quiz Game

- **Recommended pattern**: Feature-Rich Showcase + Social Proof
- **Style priority**: Vibrant & Block-based + Micro-interactions
- **Color mood**: Energetic blue + correct green + incorrect red + leaderboard gold
- **Typography mood**: Energetic + Bold + Large
- **Key effects**: Haptic feedback + Small 50-100ms animations
- **Anti-patterns**: Muted colors + Low energy
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 122. Card & Board Game

- **Recommended pattern**: Feature-Rich Showcase
- **Style priority**: 3D & Hyperrealism + Flat Design
- **Color mood**: Game-theme felt green + dark wood + card back patterns
- **Typography mood**: Bold + Clean + Sans-serif
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Complex shadows + 3D effects
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 123. Idle & Clicker Game

- **Recommended pattern**: Feature-Rich Showcase
- **Style priority**: Vibrant & Block-based + Motion-Driven
- **Color mood**: Coin gold + upgrade blue + prestige purple + progress green
- **Typography mood**: Energetic + Bold + Large
- **Key effects**: Scroll animations + Parallax + Page transitions
- **Anti-patterns**: Muted colors + Low energy
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 124. Word & Crossword Game

- **Recommended pattern**: Minimal & Direct + Demo
- **Style priority**: Minimalism + Flat Design
- **Color mood**: Clean white + warm letter tiles + success green + shake red
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Excessive decoration + Complex shadows + 3D effects
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 125. Arcade & Retro Game

- **Recommended pattern**: Feature-Rich Showcase + Hero-Centric
- **Style priority**: Pixel Art + Retro-Futurism
- **Color mood**: Neon on black + pixel palette + score gold + danger red
- **Typography mood**: Nostalgic + Monospace + Neon
- **Key effects**: Subtle hover (200ms) + Smooth transitions
- **Anti-patterns**: Inconsistent styling + Poor contrast ratios
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 126. Photo Editor & Filters

- **Recommended pattern**: Feature-Rich Showcase + Interactive Demo
- **Style priority**: Minimalism + Dark Mode (OLED)
- **Color mood**: Dark editor background + vibrant filter preview strip + tool icon accent
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle glow + Neon accents + High contrast
- **Anti-patterns**: Excessive decoration + Pure white backgrounds
- **Decision rules**:
  - `if_light_mode_needed` → `provide-theme-toggle`

## 🔴 127. Short Video Editor

- **Recommended pattern**: Feature-Rich Showcase + Hero-Centric
- **Style priority**: Dark Mode (OLED) + Motion-Driven
- **Color mood**: Dark background + timeline track accent colors + effect preview vivid
- **Typography mood**: High contrast + Light on dark
- **Key effects**: Subtle glow + Neon accents + High contrast
- **Anti-patterns**: Pure white backgrounds
- **Decision rules**:
  - `if_light_mode_needed` → `provide-theme-toggle`

## 🔴 128. Drawing & Sketching Canvas

- **Recommended pattern**: Interactive Product Demo + Storytelling
- **Style priority**: Minimalism + Dark Mode (OLED)
- **Color mood**: Neutral canvas + full-spectrum color picker + tool panel dark
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle glow + Neon accents + High contrast
- **Anti-patterns**: Excessive decoration + Pure white backgrounds
- **Decision rules**:
  - `if_light_mode_needed` → `provide-theme-toggle`

## 🔴 129. Music Creation & Beat Maker

- **Recommended pattern**: Interactive Product Demo + Storytelling
- **Style priority**: Dark Mode (OLED) + Motion-Driven
- **Color mood**: Dark studio background + track colors rainbow + waveform accent + BPM pulse
- **Typography mood**: High contrast + Light on dark
- **Key effects**: Subtle glow + Neon accents + High contrast
- **Anti-patterns**: Pure white backgrounds
- **Decision rules**:
  - `if_light_mode_needed` → `provide-theme-toggle`

## 🔴 130. Meme & Sticker Maker

- **Recommended pattern**: Feature-Rich Showcase + Social Proof
- **Style priority**: Vibrant & Block-based + Flat Design
- **Color mood**: Bold primary + comedic yellow + viral red + high saturation accent
- **Typography mood**: Bold + Clean + Sans-serif
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Complex shadows + 3D effects + Muted colors + Low energy
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 131. AI Photo & Avatar Generator

- **Recommended pattern**: Feature-Rich Showcase + Social Proof
- **Style priority**: AI-Native UI + Aurora UI
- **Color mood**: AI purple + aurora gradients + before/after neutral
- **Typography mood**: Elegant + Gradient-friendly
- **Key effects**: Flowing gradients 8-12s + Color morphing
- **Anti-patterns**: Inconsistent styling + Poor contrast ratios
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 132. Link-in-Bio Page Builder

- **Recommended pattern**: Conversion-Optimized + Social Proof
- **Style priority**: Vibrant & Block-based + Bento Box Grid
- **Color mood**: Brand-customizable + accent link color + clean white canvas
- **Typography mood**: Energetic + Bold + Large
- **Key effects**: Large section gaps 48px+ + Color shift hover + Scroll-snap
- **Anti-patterns**: Muted colors + Low energy
- **Decision rules**:
  - `if_conversion_focused` → `add-urgency-colors`
  - `if_trust_needed` → `add-testimonials`

## 🔴 133. Wardrobe & Outfit Planner

- **Recommended pattern**: Storytelling-Driven + Feature-Rich
- **Style priority**: Minimalism + Motion-Driven
- **Color mood**: Clean fashion neutral + full clothes color palette + accent
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle hover 200ms + Smooth transitions + Clean
- **Anti-patterns**: Excessive decoration
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 134. Plant Care Tracker

- **Recommended pattern**: Storytelling-Driven + Social Proof
- **Style priority**: Organic Biophilic + Soft UI Evolution
- **Color mood**: Nature greens + earth brown + sunny yellow reminder + water blue
- **Typography mood**: Warm + Humanist + Natural
- **Key effects**: Rounded 16-24px + Natural shadows + Flowing SVG
- **Anti-patterns**: Inconsistent styling + Poor contrast ratios
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 135. Book & Reading Tracker

- **Recommended pattern**: Social Proof-Focused + Feature-Rich
- **Style priority**: Swiss Modernism 2.0 + Minimalism
- **Color mood**: Warm paper white + ink brown + reading progress green + book cover colors
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle hover 200ms + Smooth transitions + Clean
- **Anti-patterns**: Excessive decoration
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 136. Couple & Relationship App

- **Recommended pattern**: Storytelling-Driven + Social Proof
- **Style priority**: Aurora UI + Soft UI Evolution
- **Color mood**: Warm romantic pink/rose + soft gradient + memory photo tones
- **Typography mood**: Elegant + Gradient-friendly
- **Key effects**: Flowing gradients 8-12s + Color morphing
- **Anti-patterns**: Inconsistent styling + Poor contrast ratios
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 137. Family Calendar & Chores

- **Recommended pattern**: Feature-Rich Showcase + Social Proof
- **Style priority**: Flat Design + Claymorphism
- **Color mood**: Warm playful + member color coding + chore completion green
- **Typography mood**: Playful + Rounded + Friendly
- **Key effects**: Multi-layer shadows + Spring bounce + Soft press 200ms
- **Anti-patterns**: Complex shadows + 3D effects
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 138. Mood Tracker

- **Recommended pattern**: Storytelling-Driven + Social Proof
- **Style priority**: Soft UI Evolution + Minimalism
- **Color mood**: Emotion gradient (blue sad to yellow happy) + pastel per mood + insight accent
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle hover 200ms + Smooth transitions + Clean
- **Anti-patterns**: Excessive decoration
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 139. Gift & Wishlist

- **Recommended pattern**: Minimal & Direct + Conversion
- **Style priority**: Vibrant & Block-based + Soft UI Evolution
- **Color mood**: Celebration warm pink/gold/red + category colors + surprise accent
- **Typography mood**: Energetic + Bold + Large
- **Key effects**: Large section gaps 48px+ + Color shift hover + Scroll-snap
- **Anti-patterns**: Muted colors + Low energy
- **Decision rules**:
  - `if_conversion_focused` → `add-urgency-colors`

## 🔴 140. Running & Cycling GPS

- **Recommended pattern**: Feature-Rich Showcase + Social Proof
- **Style priority**: Dark Mode (OLED) + Vibrant & Block-based
- **Color mood**: Energetic orange + map accent + pace zones (green/yellow/red)
- **Typography mood**: High contrast + Light on dark
- **Key effects**: Subtle glow + Neon accents + High contrast
- **Anti-patterns**: Pure white backgrounds + Muted colors + Low energy
- **Decision rules**:
  - `if_light_mode_needed` → `provide-theme-toggle`
  - `if_trust_needed` → `add-testimonials`

## 🔴 141. Yoga & Stretching Guide

- **Recommended pattern**: Storytelling-Driven + Social Proof
- **Style priority**: Organic Biophilic + Soft UI Evolution
- **Color mood**: Earth calming sage/terracotta/cream + breathing gradient + warm accent
- **Typography mood**: Warm + Humanist + Natural
- **Key effects**: Rounded 16-24px + Natural shadows + Flowing SVG
- **Anti-patterns**: Inconsistent styling + Poor contrast ratios
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 142. Sleep Tracker

- **Recommended pattern**: Feature-Rich Showcase + Social Proof
- **Style priority**: Dark Mode (OLED) + Neumorphism
- **Color mood**: Deep midnight blue + stars/moon accent + sleep quality gradient (poor red to great green)
- **Typography mood**: High contrast + Light on dark
- **Key effects**: Dual shadows (light+dark) + Soft press 150ms
- **Anti-patterns**: Pure white backgrounds
- **Decision rules**:
  - `if_light_mode_needed` → `provide-theme-toggle`
  - `if_trust_needed` → `add-testimonials`

## 🔴 143. Calorie & Nutrition Counter

- **Recommended pattern**: Feature-Rich Showcase + Social Proof
- **Style priority**: Flat Design + Vibrant & Block-based
- **Color mood**: Healthy green + macro colors (protein blue, carb orange, fat yellow) + progress circle
- **Typography mood**: Bold + Clean + Sans-serif
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Complex shadows + 3D effects + Muted colors + Low energy
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 144. Period & Cycle Tracker

- **Recommended pattern**: Social Proof-Focused + Trust
- **Style priority**: Soft UI Evolution + Aurora UI
- **Color mood**: Rose/blush + lavender + fertility green + soft calendar tones
- **Typography mood**: Elegant + Gradient-friendly
- **Key effects**: Flowing gradients 8-12s + Color morphing
- **Anti-patterns**: Inconsistent styling + Poor contrast ratios
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 145. Medication & Pill Reminder

- **Recommended pattern**: Trust & Authority + Feature-Rich
- **Style priority**: Accessible & Ethical + Flat Design
- **Color mood**: Medical trust blue + missed alert red + taken green + clean white
- **Typography mood**: Bold + Clean + Sans-serif
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Complex shadows + 3D effects + Color-only indicators
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 146. Water & Hydration Reminder

- **Recommended pattern**: Minimal & Direct + Demo
- **Style priority**: Claymorphism + Vibrant & Block-based
- **Color mood**: Refreshing blue + water wave animation + goal progress accent
- **Typography mood**: Playful + Rounded + Friendly
- **Key effects**: Multi-layer shadows + Spring bounce + Soft press 200ms
- **Anti-patterns**: Muted colors + Low energy
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 147. Fasting & Intermittent Timer

- **Recommended pattern**: Feature-Rich Showcase + Social Proof
- **Style priority**: Minimalism + Dark Mode (OLED)
- **Color mood**: Fasting deep blue/purple + eating window green + timeline neutral
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle glow + Neon accents + High contrast
- **Anti-patterns**: Excessive decoration + Pure white backgrounds
- **Decision rules**:
  - `if_light_mode_needed` → `provide-theme-toggle`
  - `if_trust_needed` → `add-testimonials`

## 🔴 148. Anonymous Community / Confession

- **Recommended pattern**: Social Proof-Focused + Feature-Rich
- **Style priority**: Dark Mode (OLED) + Minimalism
- **Color mood**: Dark protective + subtle gradient + upvote green + empathy warm accent
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle glow + Neon accents + High contrast
- **Anti-patterns**: Excessive decoration + Pure white backgrounds
- **Decision rules**:
  - `if_light_mode_needed` → `provide-theme-toggle`
  - `if_trust_needed` → `add-testimonials`

## 🔴 149. Local Events & Discovery

- **Recommended pattern**: Hero-Centric Design + Feature-Rich
- **Style priority**: Vibrant & Block-based + Motion-Driven
- **Color mood**: City vibrant + event category colors + map accent + date highlight
- **Typography mood**: Energetic + Bold + Large
- **Key effects**: Scroll animations + Parallax + Page transitions
- **Anti-patterns**: Muted colors + Low energy
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 150. Study Together / Virtual Coworking

- **Recommended pattern**: Social Proof-Focused + Feature-Rich
- **Style priority**: Minimalism + Soft UI Evolution
- **Color mood**: Calm focus blue + session progress indicator + ambient warm neutrals
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle hover 200ms + Smooth transitions + Clean
- **Anti-patterns**: Excessive decoration
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 151. Coding Challenge & Practice

- **Recommended pattern**: Feature-Rich Showcase + Social Proof
- **Style priority**: Dark Mode (OLED) + Cyberpunk UI
- **Color mood**: Code editor dark + success green + difficulty gradient (easy green / medium amber / hard red)
- **Typography mood**: High contrast + Light on dark
- **Key effects**: Subtle glow + Neon accents + High contrast
- **Anti-patterns**: Pure white backgrounds
- **Decision rules**:
  - `if_light_mode_needed` → `provide-theme-toggle`
  - `if_trust_needed` → `add-testimonials`

## 🔴 152. Kids Learning (ABC & Math)

- **Recommended pattern**: Social Proof-Focused + Trust
- **Style priority**: Claymorphism + Vibrant & Block-based
- **Color mood**: Bright primary + child-safe pastels + reward gold + interactive accent
- **Typography mood**: Playful + Rounded + Friendly
- **Key effects**: Multi-layer shadows + Spring bounce + Soft press 200ms
- **Anti-patterns**: Muted colors + Low energy
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 153. Music Instrument Learning

- **Recommended pattern**: Interactive Product Demo + Social Proof
- **Style priority**: Vibrant & Block-based + Motion-Driven
- **Color mood**: Musical warm deep red/brown + note color system + skill progress bar
- **Typography mood**: Energetic + Bold + Large
- **Key effects**: Scroll animations + Parallax + Page transitions
- **Anti-patterns**: Muted colors + Low energy
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 154. Parking Finder

- **Recommended pattern**: Conversion-Optimized + Feature-Rich
- **Style priority**: Minimalism + Glassmorphism
- **Color mood**: Trust blue + available green + occupied red + map neutral
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Backdrop blur (10-20px) + Translucent overlays
- **Anti-patterns**: Excessive decoration
- **Decision rules**:
  - `if_low_performance` → `fallback-to-flat`
  - `if_conversion_focused` → `add-urgency-colors`

## 🔴 155. Public Transit Guide

- **Recommended pattern**: Feature-Rich Showcase + Interactive Demo
- **Style priority**: Flat Design + Accessible & Ethical
- **Color mood**: Transit brand line colors + real-time indicator green/red + map neutral
- **Typography mood**: Bold + Clean + Sans-serif
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Complex shadows + 3D effects + Color-only indicators
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 156. Road Trip Planner

- **Recommended pattern**: Storytelling-Driven + Hero-Centric
- **Style priority**: Aurora UI + Organic Biophilic
- **Color mood**: Adventure warm sunset orange + map teal + stop markers + road neutral
- **Typography mood**: Elegant + Gradient-friendly
- **Key effects**: Flowing gradients 8-12s + Color morphing
- **Anti-patterns**: Inconsistent styling + Poor contrast ratios
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`

## 🔴 157. VPN & Privacy Tool

- **Recommended pattern**: Trust & Authority + Conversion-Optimized
- **Style priority**: Minimalism + Dark Mode (OLED)
- **Color mood**: Dark shield blue + connected green + disconnected red + trust accent
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle glow + Neon accents + High contrast
- **Anti-patterns**: Excessive decoration + Pure white backgrounds
- **Decision rules**:
  - `if_light_mode_needed` → `provide-theme-toggle`
  - `if_conversion_focused` → `add-urgency-colors`

## 🔴 158. Emergency SOS & Safety

- **Recommended pattern**: Trust & Authority + Social Proof
- **Style priority**: Accessible & Ethical + Flat Design
- **Color mood**: Alert red + safety blue + location green + high contrast critical
- **Typography mood**: Bold + Clean + Sans-serif
- **Key effects**: Color shift hover + Fast 150ms transitions + No shadows
- **Anti-patterns**: Complex shadows + 3D effects + Color-only indicators
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 159. Wallpaper & Theme App

- **Recommended pattern**: Feature-Rich Showcase + Social Proof
- **Style priority**: Vibrant & Block-based + Aurora UI
- **Color mood**: Content-driven + trending aesthetic palettes + download accent
- **Typography mood**: Energetic + Bold + Large
- **Key effects**: Large section gaps 48px+ + Color shift hover + Scroll-snap
- **Anti-patterns**: Muted colors + Low energy
- **Decision rules**:
  - `if_trust_needed` → `add-testimonials`

## 🔴 160. White Noise & Ambient Sound

- **Recommended pattern**: Minimal & Direct + Social Proof
- **Style priority**: Minimalism + Dark Mode (OLED)
- **Color mood**: Calming dark + ambient texture visual + subtle sound wave + sleep blue
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle glow + Neon accents + High contrast
- **Anti-patterns**: Excessive decoration + Pure white backgrounds
- **Decision rules**:
  - `if_light_mode_needed` → `provide-theme-toggle`
  - `if_trust_needed` → `add-testimonials`

## 🔴 161. Home Decoration & Interior Design

- **Recommended pattern**: Storytelling-Driven + Feature-Rich
- **Style priority**: Minimalism + 3D Product Preview
- **Color mood**: Neutral interior palette + material texture accent + AR blue
- **Typography mood**: Professional + Clean hierarchy
- **Key effects**: Subtle hover 200ms + Smooth transitions + Clean
- **Anti-patterns**: Excessive decoration
- **Decision rules**:
  - `if_ux_focused` → `prioritize-clarity`
  - `if_mobile` → `optimize-touch-targets`
