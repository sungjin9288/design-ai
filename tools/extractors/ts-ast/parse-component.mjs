#!/usr/bin/env node
// Parse a TypeScript/TSX component file and emit a normalized JSON
// description of its API surface. Used by component_spec_scaffold_v2.py.
//
// Usage:
//   node parse-component.mjs <path-to-tsx>
//   node parse-component.mjs --interface Props <path-to-tsx>
//
// Output: JSON on stdout. Empty {} if nothing useful was found.
//
// Output schema:
//   {
//     "file": "<absolute path>",
//     "interfaces": [
//       {
//         "name": "ButtonProps",
//         "extends": ["BaseButtonProps", "AriaAttributes"],
//         "props": [
//           {
//             "name": "size",
//             "type": "'sm' | 'md' | 'lg'",
//             "optional": true,
//             "deprecated": false,
//             "since": null,
//             "default": "'md'",
//             "description": "Button size",
//             "isEvent": false
//           }
//         ]
//       }
//     ],
//     "components": [
//       {
//         "name": "Button",
//         "kind": "function",
//         "propsType": "ButtonProps",
//         "destructuredDefaults": { "size": "'md'", "variant": "'default'" }
//       }
//     ]
//   }

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fail(msg) {
  process.stderr.write(`parse-component: ${msg}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { interfaceName: null, file: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--interface" || a === "-i") {
      args.interfaceName = argv[++i];
    } else if (a === "--help" || a === "-h") {
      process.stdout.write(
        "Usage: parse-component.mjs [--interface <Name>] <file.tsx>\n",
      );
      process.exit(0);
    } else if (!args.file) {
      args.file = a;
    }
  }
  if (!args.file) fail("missing file argument");
  return args;
}

// ---------- helpers ----------

function getJSDocText(node, sourceFile) {
  const tags = ts.getJSDocTags(node);
  const comment = ts.getJSDocCommentsAndTags(node)
    .filter((t) => ts.isJSDoc(t))
    .map((doc) => {
      if (typeof doc.comment === "string") return doc.comment;
      if (Array.isArray(doc.comment)) {
        return doc.comment
          .map((c) => (typeof c === "string" ? c : c.text))
          .join("");
      }
      return "";
    })
    .join(" ")
    .trim();

  let deprecated = false;
  let since = null;
  let defaultValue = null;
  for (const tag of tags) {
    const tagName = tag.tagName.escapedText;
    if (tagName === "deprecated") deprecated = true;
    if (tagName === "since") {
      since = typeof tag.comment === "string"
        ? tag.comment.trim()
        : null;
    }
    if (tagName === "default" || tagName === "defaultValue") {
      defaultValue = typeof tag.comment === "string"
        ? tag.comment.trim()
        : null;
    }
  }

  return { comment, deprecated, since, defaultValue };
}

function typeText(node, sourceFile) {
  if (!node) return "";
  return node.getText(sourceFile).replace(/\s+/g, " ").trim();
}

function parsePropertyMember(member, sourceFile) {
  if (!ts.isPropertySignature(member)) return null;
  const name = member.name && member.name.getText(sourceFile);
  if (!name) return null;
  const optional = member.questionToken !== undefined;
  const type = typeText(member.type, sourceFile);
  const jsdoc = getJSDocText(member, sourceFile);
  const isEvent = /^on[A-Z]/.test(name);
  return {
    name,
    type,
    optional,
    deprecated: jsdoc.deprecated,
    since: jsdoc.since,
    default: jsdoc.defaultValue || "",
    description: (jsdoc.comment || "").slice(0, 240),
    isEvent,
  };
}

function parseInterface(node, sourceFile) {
  const name = node.name.escapedText;
  const ext = [];
  if (node.heritageClauses) {
    for (const clause of node.heritageClauses) {
      for (const type of clause.types) {
        ext.push(typeText(type, sourceFile));
      }
    }
  }
  const props = [];
  for (const member of node.members) {
    const parsed = parsePropertyMember(member, sourceFile);
    if (parsed) props.push(parsed);
  }
  return { name, extends: ext, props };
}

function parseTypeAlias(node, sourceFile) {
  // Handle: type ButtonProps = { ... } or type ButtonProps = Foo & { ... }
  // We only collect explicit object-literal members at the top level.
  const name = node.name.escapedText;
  const ext = [];
  const props = [];

  function collectFromTypeNode(typeNode) {
    if (ts.isTypeLiteralNode(typeNode)) {
      for (const member of typeNode.members) {
        const parsed = parsePropertyMember(member, sourceFile);
        if (parsed) props.push(parsed);
      }
    } else if (ts.isIntersectionTypeNode(typeNode)) {
      for (const t of typeNode.types) collectFromTypeNode(t);
    } else if (ts.isTypeReferenceNode(typeNode)) {
      ext.push(typeText(typeNode, sourceFile));
    }
  }

  if (node.type) collectFromTypeNode(node.type);
  return { name, extends: ext, props };
}

function destructuredDefaults(parameter, sourceFile) {
  const out = {};
  if (!parameter) return out;
  // function Button({ size = 'md', variant = 'default' }: ButtonProps)
  if (
    ts.isObjectBindingPattern(parameter.name) ||
    (parameter.name && parameter.name.kind === ts.SyntaxKind.ObjectBindingPattern)
  ) {
    const pattern = parameter.name;
    for (const element of pattern.elements) {
      if (element.initializer) {
        const propName =
          element.propertyName?.getText(sourceFile) ||
          element.name.getText(sourceFile);
        out[propName] = element.initializer.getText(sourceFile);
      }
    }
  }
  return out;
}

function findComponents(sourceFile) {
  const components = [];

  function visit(node) {
    // function MyComponent(...) { ... }
    if (
      ts.isFunctionDeclaration(node) &&
      node.name &&
      /^[A-Z]/.test(node.name.escapedText.toString())
    ) {
      const params = node.parameters;
      const propsType = params[0]?.type ? typeText(params[0].type, sourceFile) : "";
      const defaults = destructuredDefaults(params[0], sourceFile);
      components.push({
        name: node.name.escapedText.toString(),
        kind: "function",
        propsType,
        destructuredDefaults: defaults,
      });
    }

    // const MyComponent = (...) => {...} or React.forwardRef(...)
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        const compName = decl.name.escapedText.toString();
        if (!/^[A-Z]/.test(compName)) continue;

        let propsType = "";
        let defaults = {};
        let kind = "variable";

        const init = decl.initializer;
        if (!init) continue;

        // Arrow function: ({ ... }: Props) => { ... }
        if (ts.isArrowFunction(init)) {
          const params = init.parameters;
          propsType = params[0]?.type ? typeText(params[0].type, sourceFile) : "";
          defaults = destructuredDefaults(params[0], sourceFile);
          kind = "arrow";
        }

        // React.forwardRef<RefType, Props>((props, ref) => ...)
        if (ts.isCallExpression(init)) {
          const callee = init.expression;
          const calleeText = callee.getText(sourceFile);
          if (/forwardRef|memo|React\.forwardRef|React\.memo/.test(calleeText)) {
            // Try to read type args
            if (init.typeArguments && init.typeArguments.length >= 2) {
              propsType = typeText(init.typeArguments[1], sourceFile);
            }
            const inner = init.arguments[0];
            if (inner && (ts.isArrowFunction(inner) || ts.isFunctionExpression(inner))) {
              const params = inner.parameters;
              if (!propsType) {
                propsType = params[0]?.type ? typeText(params[0].type, sourceFile) : "";
              }
              defaults = destructuredDefaults(params[0], sourceFile);
            }
            kind = "forwardRef";
          }
        }

        if (propsType || Object.keys(defaults).length > 0) {
          components.push({
            name: compName,
            kind,
            propsType,
            destructuredDefaults: defaults,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return components;
}

function findInterfacesAndTypes(sourceFile) {
  const interfaces = [];
  function visit(node) {
    if (ts.isInterfaceDeclaration(node)) {
      interfaces.push(parseInterface(node, sourceFile));
    } else if (ts.isTypeAliasDeclaration(node)) {
      interfaces.push(parseTypeAlias(node, sourceFile));
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return interfaces;
}

// ---------- main ----------

function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = path.resolve(args.file);

  if (!fs.existsSync(filePath)) {
    fail(`file not found: ${filePath}`);
  }

  const text = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    path.basename(filePath),
    text,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    /\.tsx?$/.test(filePath) ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  let interfaces = findInterfacesAndTypes(sourceFile);
  const components = findComponents(sourceFile);

  // Filter to a specific interface if requested
  if (args.interfaceName) {
    interfaces = interfaces.filter((i) => i.name === args.interfaceName);
  }

  const output = {
    file: filePath,
    interfaces,
    components,
  };

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
}

main();
