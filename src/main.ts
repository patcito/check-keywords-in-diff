import * as core from '@actions/core';
import fs from 'fs';
import {parseInputs} from './inputs';
import {processDiff} from './processing';
import {createRun, createComment} from './notifications';

async function run(): Promise<void> {
  try {
    core.debug(`Parsing inputs`);
    const inputs = parseInputs(core.getInput);
    console.log('inputs', inputs);
    core.debug(`Calculate result`);
    const result = await processDiff(inputs.branch);
    if (result.passed) {
      if (inputs.notifications) {
        core.debug(`Setting up OctoKit`);
        if (inputs.notifications.check) {
          core.debug(`Notification: Check Run`);
        }
        if (inputs.notifications.issue) {
          core.debug(`Notification: Issue`);
          await createComment(result, inputs.notifications.token, inputs.notifications.label);
        }
      }
    }

    core.info(result.summary);
    core.info('===');

    core.debug(`Setting outputs`);
    core.setOutput('found something', result.passed ? 'true' : 'false');

    core.debug(`Done`);
  } catch (error) {
    core.debug(`Error: ${error}`);
    core.setFailed(error.message);
  }
}

run();
