/**
 * Code Connect example for the Input component.
 * See examples/component-input.md for the full spec.
 */

import figma from "@figma/code-connect";
import { Input } from "./Input";

figma.connect(Input, "https://www.figma.com/file/REPLACE_ME/?node-id=REPLACE_ME", {
  props: {
    label: figma.string("Label"),
    placeholder: figma.string("Placeholder"),
    helpText: figma.string("Help text"),
    errorText: figma.string("Error text"),
    size: figma.enum("Size", {
      Small: "sm",
      Medium: "md",
      Large: "lg",
    }),
    type: figma.enum("Type", {
      Text: "text",
      Email: "email",
      Password: "password",
      Tel: "tel",
      URL: "url",
      Search: "search",
    }),
    required: figma.boolean("Required"),
    disabled: figma.boolean("Disabled"),
    readOnly: figma.boolean("Read only"),
    error: figma.boolean("Error state"),
    iconStart: figma.children("Icon start"),
    iconEnd: figma.children("Icon end"),
  },
  example: ({ label, placeholder, helpText, errorText, size, type, required, disabled, readOnly, error, iconStart, iconEnd }) => (
    <Input
      label={label}
      placeholder={placeholder}
      helpText={helpText}
      errorText={errorText}
      size={size}
      type={type}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      error={error}
      iconStart={iconStart}
      iconEnd={iconEnd}
    />
  ),
});
