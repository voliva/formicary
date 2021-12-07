const esbuild = require('esbuild')
const ts = require('typescript');
const fs = require('fs');
const fsP = require('fs/promises');
const path = require('path');

fs.rmSync('./dist', { recursive: true })

function buildSource(options) {
  return esbuild.build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    external: ['react', 'derive-state'],
    ...options
  })
}

function buildTypes() {
  const program = ts.createProgram({
    rootNames: ['./src/index.ts'],
    options: {
      declaration: true,
      declarationDir: 'dist/types',
      emitDeclarationOnly: true,

      lib: ["lib.dom.d.ts", "lib.esnext.d.ts"],
      // moduleResolution: "node",
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true
    }
  });
  let emitResult = program.emit();

  let allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics);

  allDiagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      let { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
      let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
      console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    }
  });

  if (emitResult.emitSkipped || allDiagnostics.length) {
    return Promise.reject("Typescript check failed");
  }
  return Promise.resolve(0);
}

async function fakeFormRef() {
  const filename = path.join("dist", "types", "index.d.ts");
  const contents = await fsP.readFile(filename, 'utf-8');

  const originalLines = contents
    .split('\n');

  let replaced = false;
  const newLines = originalLines.filter(line => !line.includes('./internal/formRef'))
    .map(line => {
      if (line.includes('./fakeFormRef')) {
        replaced = true;
        return "export { FormRef } from './fakeFormRef';";
      }
      return line;
    })

  if (newLines.length === originalLines.length) {
    throw new Error("fakeFormRef: Couldn't find target line to remove in index.d.ts");
  }
  if (!replaced) {
    throw new Error("fakeFormRef: Couldn't find target line to replace in index.d.ts");
  }

  const newContents = newLines
    .join('\n');

  return fsP.writeFile(filename, newContents);
}

const tasks = [
  () => Promise.all([
    buildSource({
      outfile: './dist/formicary.esm.js',
      format: 'esm',
    }), buildSource({
      outfile: './dist/index.js',
      format: 'cjs',
    }),
    buildTypes()
  ]),
  fakeFormRef
];

async function runTasks() {
  for (let task of tasks) {
    await task();
  }
}

runTasks().then(
  () => {
    console.log('complete');
    process.exit(0)
  },
  err => {
    console.log(err);
    process.exit(1);
  }
)