const { spawn, spawnSync } = require("child_process");

async function runDev() {
  console.log("🚀 Iniciando ambiente de desenvolvimento...");

  const runCommand = (command) => {
    // eslint-disable-next-line no-undef
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
    // spawnSync é crucial aqui para garantir que o Node não feche antes do Docker parar
    spawnSync("npm run services:stop", { stdio: "inherit", shell: true });
  };

  try {
    // Fluxo inicial idêntico ao original do projeto
    await runCommand("npm run services:up");
    await runCommand("npm run services:wait:database");
    await runCommand("npm run migrations:up");

    console.log("📡 Servidor Next.js a iniciar...");
    const nextProcess = spawn("npx next dev", {
      stdio: "inherit",
      shell: true,
    });

    // Captura o CTRL+C (SIGINT) e encerramento de terminal (SIGTERM)
    process.on("SIGINT", () => {
      stopServices();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      stopServices();
      process.exit(0);
    });

    // Se o processo do Next.js terminar (por erro ou manualmente), limpa o Docker
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
