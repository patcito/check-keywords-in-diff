import * as Inputs from './namespaces/Inputs';
import {diffLines, createTwoFilesPatch} from 'diff';
import fs from 'fs';
import { execSync } from "child_process";
export type Result = {
  result: Inputs.Tolerance;
  passed: boolean;
  summary: string;
};

type ToleranceLevelMap = Record<Inputs.Tolerance, number>;

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

const getSummary = (passed: boolean, found: any): string => {
  let summary= ""
  Object.keys(found).forEach(key=>{
    console.log()
    summary += `Found ${found[key]} in file ${key} \n`
  })
  if (!passed) {
    return summary;
  }
  return `No important keywords were found in this diff.`;
};

export const processDiff =  (old: string, newPath: string, mode: Inputs.Mode, expected: Inputs.Tolerance): Result => {
  let constants = ["test","shoop"];
  let x = execSync("git diff origin/main HEAD").toString();
  let found: any = {}
  let currentFile = ""
  x.split("\n").forEach((line) => {
      if(line.includes("diff --git a")){
          currentFile = line.split(" b/")[1]
      }
    constants.forEach((constant) => {
      if (line.includes(constant)) {
        console.log("line includes " + constant, currentFile);
        found[currentFile] = constant
      }
    });
  });
  let foundSomething = true
  Object.keys(found).forEach((key)=>{
    console.log(`Found ${found[key]} in file ${key}`)
    foundSomething = false
})
console.log(found)

  let result = Inputs.Tolerance.Same;
  let passed = true
  return {
    result,
    passed,
    summary: getSummary(foundSomething, found),
  };
};
