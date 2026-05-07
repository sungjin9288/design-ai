/**
 * Code Connect example for the Card component (composition pattern).
 * See examples/component-card.md for the full spec.
 *
 * Composition: Card.Header / Card.Body / Card.Footer slots map to
 * Figma child layers via `figma.children` selectors.
 */

import figma from "@figma/code-connect";
import { Card } from "./Card";

figma.connect(Card, "https://www.figma.com/file/REPLACE_ME/?node-id=REPLACE_ME", {
  props: {
    variant: figma.enum("Variant", {
      Outline: "outline",
      Filled: "filled",
      Elevated: "elevated",
    }),
    padding: figma.enum("Padding", {
      None: "none",
      Small: "sm",
      Medium: "md",
      Large: "lg",
    }),
    interactive: figma.boolean("Interactive"),
    cover: figma.children("Cover"),
    header: figma.children("Header"),
    body: figma.children("Body"),
    footer: figma.children("Footer"),
  },
  example: ({ variant, padding, interactive, cover, header, body, footer }) => (
    <Card variant={variant} padding={padding} interactive={interactive}>
      {cover && <Card.Cover>{cover}</Card.Cover>}
      {header && <Card.Header>{header}</Card.Header>}
      {body && <Card.Body>{body}</Card.Body>}
      {footer && <Card.Footer>{footer}</Card.Footer>}
    </Card>
  ),
});
