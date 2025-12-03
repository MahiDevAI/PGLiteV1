import { build as viteBuild } from "vite";
import { rm } from "fs/promises";
import ts from "typescript";
import path from "path";


async function buildAll() {
console.log("🧹 Cleaning server/dist and dist...");
await rm(path.join("server", "dist"), { recursive: true, force: true });
await rm("dist", { recursive: true, force: true });


console.log("🎨 Building client (Vite)...");
await viteBuild();


console.log("⚙️ Compiling server (TypeScript -> JS)...");


// locate tsconfig in server/ and compile
const tsConfigFile = ts.findConfigFile("./server", ts.sys.fileExists, "tsconfig.json");
if (!tsConfigFile) {
throw new Error("Could not find server/tsconfig.json");
}


const readResult = ts.readConfigFile(tsConfigFile, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(readResult.config, ts.sys, path.dirname(tsConfigFile));


const program = ts.createProgram(parsed.fileNames, parsed.options);
const emitResult = program.emit();


const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
if (allDiagnostics.length > 0) {
allDiagnostics.forEach((d) => {
const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
if (d.file && d.start !== undefined) {
const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
console.error(`${d.file.fileName} (${line + 1},${character + 1}): ${msg}`);
} else {
console.error(msg);
}
});
throw new Error("TypeScript compilation errors");
}


console.log("✅ Server compiled to server/dist/*.js");
}


buildAll().catch((err) => {
console.error("❌ Build failed:\n", err);
process.exit(1);
});
