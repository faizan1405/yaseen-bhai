const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(file => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          // ignore node_modules, .git, .next, prisma
          if (file.includes('node_modules') || file.includes('.git') || file.includes('.next') || file.includes('prisma')) {
            if (!--pending) done(null, results);
            return;
          }
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          // only process ts, tsx, js, css, json, md, html
          if (/\.(ts|tsx|js|css|json|md|html)$/.test(file)) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

const replaceInFile = (file) => {
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) return console.log(err);
    
    let result = data;
    
    // Replace names
    result = result.replace(/Rishte Forever/g, 'Asan Nikah');
    result = result.replace(/RishteForever/g, 'AsanNikah');
    result = result.replace(/rishte forever/gi, 'asan nikah');
    
    // Replace domains & handles
    result = result.replace(/rishteforever\.in/g, 'asannikah.com');
    result = result.replace(/rishteforever\.com/g, 'asannikah.com');
    result = result.replace(/rishteforever/g, 'asannikah');
    
    // Package names update
    result = result.replace(/Silver Plan/g, 'Basic Access');
    result = result.replace(/Silver plan/g, 'Basic Access');
    result = result.replace(/silver plan/gi, 'basic access');
    
    result = result.replace(/Gold Package/g, 'Premium Match Access');
    result = result.replace(/Gold package/g, 'Premium Match Access');
    result = result.replace(/gold package/gi, 'premium match access');
    
    result = result.replace(/Personalized Package/g, 'Personalized Matchmaking');
    
    if (result !== data) {
      fs.writeFile(file, result, 'utf8', (err) => {
        if (err) return console.log(err);
        console.log(`Updated ${file}`);
      });
    }
  });
};

const dirsToScan = [
  path.resolve(__dirname, '../src'),
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, '../app'), // if it's there
  path.resolve(__dirname, '../') // for package.json, next.config, etc.
];

dirsToScan.forEach(dir => {
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    if (dir === path.resolve(__dirname, '../')) {
      // For root, just do specific files to avoid scanning everything again
      const rootFiles = ['package.json', 'README.md', 'next.config.ts'];
      rootFiles.forEach(f => {
        const p = path.resolve(dir, f);
        if (fs.existsSync(p)) replaceInFile(p);
      });
    } else {
      walk(dir, (err, results) => {
        if (err) throw err;
        results.forEach(replaceInFile);
      });
    }
  }
});
