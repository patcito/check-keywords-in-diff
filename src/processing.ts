import * as Inputs from './namespaces/Inputs';
import {execSync} from 'child_process';
import fetch from 'node-fetch';

export type Result = {
  passed: boolean;
  summary: string;
};
const matchAll = require('string.prototype.matchall');

type ToleranceLevelMap = Record<Inputs.Tolerance, number>;
type Token = {
  address: string;
  symbol: string;
};
type Vault = {
  address: string;
  symbol: string;
  token: Token;
};

const getSummary = (passed: boolean, found: any, foundAddresses: any, vaults: Vault[], foundConstants: any): string => {
  let summary = '';
  Object.keys(foundConstants).forEach(key => {
    summary += `- Found constant \`${key}\` in files ${foundConstants[key].files.join(', ')}  \n`;
  });
  Object.keys(found).forEach(key => {
    summary += `- Found keyword \`${key}\` in files ${found[key].files.join(', ')}  \n`;
  });
  Object.keys(foundAddresses).forEach(key => {
    foundAddresses[key].origin = `was ⚠️not found⚠️ in any vaults from https://vaults.finance/all`;
    vaults.map(v => {
      if (v.address.toLowerCase() === key.toLowerCase()) {
        foundAddresses[key].vault = v;
        foundAddresses[key].origin = `is from vault \`${v.symbol}\``;
      } else if (v.token.address.toLowerCase() === key.toLowerCase()) {
        foundAddresses[key].token = v.token;
        foundAddresses[key].origin = `is from token \`${v.token.symbol}\``;
      }
    });
    summary += `- Found address [${key}](https://etherscan.io/address/${key}) in files ${foundAddresses[key].files.join(
      ', ',
    )}. This address ${foundAddresses[key].origin}  \n`;
  });
  if (passed) {
    return summary;
  }
  return `No important keywords were found in this diff.`;
};

export const processDiff = async (branch: string = 'main'): Promise<Result> => {
  let web3Interactions = ['web3', 'cacheSend'];
  let x = execSync(`git diff origin/${branch} HEAD`).toString();
  let found: any = {};
  let currentFile = '';
  let foundAddresses: any = {};
  let foundConstants: any = {};
  console.log('branch', branch);
  x.split('\n').forEach(l => {
    console.log('line', l);
    let line: string = l;
    if ((l && l[0] === '-') || l[0] === '+') {
      if (line.includes('diff --git a')) {
        currentFile = line.split(' b/')[1];
      }
      let ll: {} = l;
      let fa = [...matchAll(line, /0x[a-fA-F0-9]{40}/g)];
      let fc = [...matchAll(line, /\b[A-Z]+_[A-Z_]*[A-Z]\b/g)];
      fc.forEach(constant => {
        if (!foundConstants[constant] || !foundConstants[constant]?.files) {
          foundConstants[constant] = {files: [`${currentFile} (\`${line}\`)`]};
        } else if (Array.isArray(foundConstants[constant].files)) {
          if (foundConstants[constant].files.indexOf(`${currentFile} (\`${line}\`)`) === -1)
            foundConstants[constant].files.push(`${currentFile} (\`${line}\`)`);
        }
      });

      fa.forEach(address => {
        if (!foundAddresses[address] || !foundAddresses[address]?.files) {
          foundAddresses[address] = {files: [currentFile]};
        } else if (Array.isArray(foundAddresses[address].files)) {
          if (foundAddresses[address].files.indexOf(currentFile) === -1)
            foundAddresses[address].files.push(currentFile);
        }
      });

      web3Interactions.forEach(web3Keyword => {
        if (line.includes(web3Keyword)) {
          if (!found[web3Keyword] || !found[web3Keyword]?.files) {
            found[web3Keyword] = {files: [`${currentFile} (\`${line}\`)`]};
          } else if (Array.isArray(found[web3Keyword].files)) {
            if (found[web3Keyword].files.indexOf(`${currentFile} (\`${line}\`)`) === -1)
              found[web3Keyword].files.push(`${currentFile} (\`${line}\`)`);
          }
        }
      });
    }
  });

  let passed =
    Object.keys(found).length > 0 || Object.keys(foundAddresses).length > 0 || Object.keys(foundConstants).length > 0;
  const response = await fetch('https://vaults.finance/all');
  const vaults: Vault[] = await response.json();
  return {
    passed,
    summary: getSummary(passed, found, foundAddresses, vaults, foundConstants),
  };
};
