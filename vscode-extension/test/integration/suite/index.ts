// Mocha suite loader. Discovers all *.test.js files in this directory.

import * as path from "node:path";
import * as fs from "node:fs";
import Mocha from "mocha";

export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
    timeout: 30_000, // VS Code activation can be slow on cold cache
  });

  const testsRoot = path.resolve(__dirname);

  return new Promise((resolve, reject) => {
    const files = fs
      .readdirSync(testsRoot)
      .filter((name) => name.endsWith(".test.js"));

    for (const file of files) {
      mocha.addFile(path.resolve(testsRoot, file));
    }

    try {
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} test(s) failed`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
