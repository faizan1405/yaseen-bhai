const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cwd = 'c:\\Users\\Faiza\\Downloads\\012\\website\\Gulzar bhai';
const logFile = path.join(cwd, 'deploy_log.txt');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}

fs.writeFileSync(logFile, '--- DEPLOY START ---\n');

function run(cmd) {
  log(`Running: ${cmd}`);
  try {
    const stdout = execSync(cmd, { cwd, stdio: 'pipe' }).toString();
    log(stdout);
  } catch (err) {
    log(`Error running ${cmd}:`);
    if (err.stdout) log(err.stdout.toString());
    if (err.stderr) log(err.stderr.toString());
    log(err.message);
    throw err;
  }
}

try {
  run('git add .');
  try {
    run('git commit -m "Update website"');
  } catch (e) {
    log("No changes to commit or commit failed. Proceeding...");
  }
  run('git push origin main');
  run('npx vercel --prod --yes');
  log("SUCCESSFULLY DEPLOYED");
} catch (error) {
  log("Deployment failed: " + error.message);
  process.exit(1);
}
