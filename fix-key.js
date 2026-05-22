// 修复私钥格式并重新设置
const fs = require('fs');

// 读取私钥文件
const keyPath = process.argv[2];
if (!keyPath) {
  console.error('Usage: node fix-key.js <path-to-key-file>');
  process.exit(1);
}

const keyContent = fs.readFileSync(keyPath, 'utf-8');
console.log('Key content preview:');
console.log(keyContent.substring(0, 100));
console.log('...');
console.log(keyContent.substring(keyContent.length - 50));
console.log('\nLength:', keyContent.length);
console.log('Contains BEGIN:', keyContent.includes('BEGIN PRIVATE KEY'));
console.log('Contains END:', keyContent.includes('END PRIVATE KEY'));
