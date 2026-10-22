import {hashPassword} from '../src/auth.mjs';
import readline from 'node:readline';
// Disable terminal echo while collecting a password; never pass it as a command argument.
if(!process.stdin.isTTY)throw Error('Run npm run password in an interactive terminal.');
process.stdout.write('Choose an admin password (at least 12 characters): ');process.stdin.setRawMode(true);process.stdin.resume();let password='';process.stdin.on('data',data=>{for(const c of data.toString()){if(c==='\u0003')process.exit(1);if(c==='\r'||c==='\n'){process.stdin.setRawMode(false);process.stdin.pause();if(password.length<12){console.error('\nUse at least 12 characters.');process.exit(1);}console.log('\nADMIN_PASSWORD_HASH='+hashPassword(password));process.exit(0);}else if(c==='\u007f')password=password.slice(0,-1);else if(c>=' ')password+=c;}});
