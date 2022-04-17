const esbuild = require('esbuild')
const ts = require('typescript');
const fs = require('fs');
const fsP = require('fs/promises');
const path = require('path');

if(fs.existsSync('./dist')) {
  fs.rmSync('./dist', { recursive: true })
}

function buildSource(options) {
  return esbuild.build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    external: ['react', 'derive-state'],
    target: 'es2019',
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
  const filename = path.join("dist", "types", "internal", "formRef.d.ts");
  const contents = await fsP.readFile(filename, 'utf-8');

  const originalLines = contents
    .split('\n');

  let removed_real = false;
  let replaced_fake = false;
  const newLines = originalLines.map(line => {
    if (!line.startsWith("export {")) {
      return line;
    }
    if (line.includes('FormRef, ')) {
      removed_real = true;
      return line.replace('FormRef, ', '');
    }
    if (line.includes('FormRef as FakeFormRef')) {
      replaced_fake = true;
      return line.replace('FormRef as FakeFormRef', 'FormRef');
    }
    return line;
  })

  if (!removed_real) {
    throw new Error("fakeFormRef: Couldn't find target export to remove in index.d.ts");
  }
  if (!replaced_fake) {
    throw new Error("fakeFormRef: Couldn't find target export to replace in index.d.ts");
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