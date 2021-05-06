import * as Inputs from './namespaces/Inputs';
import {diffLines, createTwoFilesPatch} from 'diff';
import fs from 'fs';
import {execSync} from 'child_process';
export type Result = {
  result: Inputs.Tolerance;
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
const levels: ToleranceLevelMap = {
  [Inputs.Tolerance.Better]: 3,
  [Inputs.Tolerance.Same]: 2,
  [Inputs.Tolerance.MixedBetter]: 1,
  [Inputs.Tolerance.Mixed]: -1,
  [Inputs.Tolerance.MixedWorse]: -2,
  [Inputs.Tolerance.Worse]: -3,
};

const compareTolerance = (expected: Inputs.Tolerance, result: Inputs.Tolerance): boolean => {
  return levels[result] >= levels[expected];
};

const getSummary = (passed: boolean, found: any, foundAddresses: any, vaults: Vault[]): string => {
  let summary = '';
  Object.keys(found).forEach(key => {
    console.log();
    summary += `Found keyword ${key} in files ${found[key].files.join(', ')}  \n`;
  });
  Object.keys(foundAddresses).forEach(key => {
    console.log();
    vaults.map(v => {
      if (v.address.toLowerCase() === key.toLowerCase()) {
        foundAddresses[key].vault = v;
        foundAddresses[key].origin = `is from vault ${v.symbol}`;
      } else if (v.token.address === key.toLowerCase()) {
        foundAddresses[key].token = v.token;
        foundAddresses[key].origin = `is from token ${v.token.symbol}`;
      } else {
        foundAddresses[key].origin = `was ⚠️not found⚠️ in any vaults from https://vaults.finance/all`;
      }
    });
    summary += `Found address ${key} in files ${foundAddresses[key].files.join(', ')}. This
    address is from ${foundAddresses[key].origin}  \n`;
  });
  if (!passed) {
    return summary;
  }
  return `No important keywords were found in this diff.`;
};

export const processDiff = async (
  old: string,
  newPath: string,
  mode: Inputs.Mode,
  expected: Inputs.Tolerance,
): Promise<Result> => {
  let constants = ['test', 'shoop'];
  let x = execSync('git diff origin/main HEAD').toString();
  let found: any = {};
  let currentFile = '';
  let foundAddresses: any = {};
  x.split('\n').forEach(l => {
    let line: string = l;
    if (line.includes('diff --git a')) {
      currentFile = line.split(' b/')[1];
    }
    let ll: {} = l;
    let fa = [...matchAll(line, /0x[a-fA-F0-9]{40}/g)];
    fa.forEach(address => {
      if (!foundAddresses[address] || !foundAddresses[address]?.files) {
        foundAddresses[address] = {files: [currentFile]};
      } else if (Array.isArray(foundAddresses[address].files)) {
        if (foundAddresses[address].files.indexOf(currentFile) === -1) foundAddresses[address].files.push(currentFile);
      }
    });

    constants.forEach(constant => {
      if (line.includes(constant)) {
        //      console.log("line includes " + constant, currentFile);
        if (!found[constant] || !found[constant]?.files) {
          found[constant] = {files: [currentFile]};
        } else if (Array.isArray(found[constant].files)) {
          if (found[constant].files.indexOf(currentFile) === -1) found[constant].files.push(currentFile);
        }
      }
    });
  });
  let foundSomething = true;
  Object.keys(found).forEach(key => {
    //    console.log(`Found ${found[key]} in file ${key}`)
    foundSomething = false;
  });
  console.log(found);

  let result = Inputs.Tolerance.Same;
  let passed = true;
  const response = await fetch('https://vaults.finance/all');
  const vaults: Vault[] = await response.json();
  return {
    result,
    passed,
    summary: getSummary(foundSomething, found, foundAddresses, vaults),
  };
};
