const { spawn } = require("child_process");
const path = require("path");

const env = {
  ...process.env,
  PORT: "3001",
  NEXT_DIST_DIR: ".next-duckdb",
  NEXT_PUBLIC_API_BASE_URL: "http://localhost:8001/api/v1",
};

const nextBin = path.join(__dirname, "node_modules", "next", "dist", "bin", "next");

console.log("Starting DuckDB Frontend Dev Server on port 3001 pointing to http://localhost:8001/api/v1...");

const child = spawn(process.execPath, [nextBin, "dev", "-p", "3001"], {
  cwd: __dirname,
  env,
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
