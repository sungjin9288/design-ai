/**
 * Code Connect example for the Button component.
 *
 * This file maps a Figma main component to the actual production
 * code component. After running `npx figma connect publish`, the
 * Figma Inspect panel shows real, copyable code matching whatever
 * variant the designer selects.
 *
 * Setup:
 *   1. Replace `./Button` with your project's actual Button path.
 *   2. Replace the Figma URL with your Figma main component's URL
 *      (right-click → Copy link).
 *   3. `npm install -D @figma/code-connect`
 *   4. `npx figma connect publish`
 */

import figma from "@figma/code-connect";
import { Button } from "./Button";

figma.connect(Button, "https://www.figma.com/file/REPLACE_ME/?node-id=REPLACE_ME", {
  props: {
    intent: figma.enum("Intent", {
      Primary: "primary",
      Neutral: "neutral",
      Danger: "danger",
      Success: "success",
      Warning: "warning",
    }),
    variant: figma.enum("Variant", {
      Solid: "solid",
      Outline: "outline",
      Ghost: "ghost",
      Link: "link",
    }),
    size: figma.enum("Size", {
      Small: "sm",
      Medium: "md",
      Large: "lg",
    }),
    disabled: figma.boolean("Disabled"),
    loading: figma.boolean("Loading"),
    fullWidth: figma.boolean("Full width"),
    children: figma.children("Label"),
    iconStart: figma.children("Icon start"),
    iconEnd: figma.children("Icon end"),
  },
  example: ({ intent, variant, size, disabled, loading, fullWidth, children, iconStart, iconEnd }) => (
    <Button
      intent={intent}
      variant={variant}
      size={size}
      disabled={disabled}
      loading={loading}
      fullWidth={fullWidth}
      iconStart={iconStart}
      iconEnd={iconEnd}
    >
      {children}
    </Button>
  ),
});

// Variants (separate Figma components mapped to the same React component
// with different default props):
figma.connect(Button, "https://www.figma.com/file/REPLACE_ME/?node-id=DESTRUCTIVE_VARIANT", {
  example: ({ children }) => (
    <Button intent="danger" variant="solid">
      {children}
    </Button>
  ),
});
