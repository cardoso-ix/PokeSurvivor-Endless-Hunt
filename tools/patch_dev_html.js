const fs = require('fs');
const path = require('path');

const devPath = path.join(__dirname, '../dev.html');
let content = fs.readFileSync(devPath, 'utf8');

const target = '<script defer src="js/core/util.js"></script>';
const replacement = '<script defer src="js/core/util.js"></script>\r\n<script defer src="js/config/balanceConfig.js"></script>';

if (!content.includes('js/config/balanceConfig.js')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(devPath, content, 'utf8');
  console.log('✅ dev.html atualizado com js/config/balanceConfig.js');
} else {
  console.log('ℹ️ js/config/balanceConfig.js já presente em dev.html');
}
