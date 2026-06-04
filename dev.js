const { spawn, spawnSync } = require("child_process");

async function runDev() {
  console.log("🚀 Iniciando ambiente de desenvolvimento...");

  const runCommand = (command) => {
    return new Promise((resolve, reject) => {
      const process = spawn(command, { stdio: "inherit", shell: true });
      process.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Falha no comando: ${command}`));
      });
    });
  };

  const stopServices = () => {
    console.log("\n🛑 Encerrando containers do banco de dados...");
    spawnSync("npm run services:stop", { stdio: "inherit", shell: true });
  };

  try {
    await runCommand("npm run services:up");
    await runCommand("npm run services:wait:database");
    await runCommand("npm run migrations:up");

    console.log("📡 Servidor Next.js a iniciar...");
    const nextProcess = spawn("npx next dev", {
      stdio: "inherit",
      shell: true,
    });

    process.on("SIGINT", () => {
      stopServices();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      stopServices();
      process.exit(0);
    });

    nextProcess.on("close", () => {
      stopServices();
      process.exit(0);
    });
  } catch (error) {
    console.error("\n❌ Erro na inicialização:", error.message);
    stopServices();
    process.exit(1);
  }
}

runDev();
