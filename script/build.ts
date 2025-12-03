import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// Server deps to bundle for faster cold start and fewer syscalls
const allowlist = [
  "@google/generative-ai",
  "@neondatabase/serverless",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  // Clean only server's dist directory
  await rm("server/dist", { recursive: true, force: true });

  console.log("🚀 Building client...");
  await viteBuild();

  console.log("🔧 Building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));

  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];

  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",

    // Output directory for server build
    outfile: "server/dist/index.cjs",

    define: {
      "process.env.NODE_ENV": "\"production\"",
    },

    minify: true,
    external: externals,
    logLevel: "info",
  });

  console.log("✅ Server build completed!");
}

buildAll().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
