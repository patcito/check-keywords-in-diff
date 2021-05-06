import * as core from '@actions/core';
import fs from 'fs';
import {parseInputs} from './inputs';
import {processDiff} from './processing';
import {createRun, createComment} from './notifications';

async function run(): Promise<void> {
  try {
    console.log('000creating notification');
    core.debug(`Parsing inputs`);
    const inputs = parseInputs(core.getInput);
    console.log('inputs', inputs);
    core.debug(`Calculate result`);
    const result = await processDiff(inputs.old, inputs.new, inputs.mode, inputs.tolerance);

    if (inputs.notifications) {
      console.log('11111creating notification');
      core.debug(`Setting up OctoKit`);
      if (inputs.notifications.check) {
        core.debug(`Notification: Check Run`);
        //        await createRun(octokit, octokit, result,   inputs.notifications.label);
      }
      console.log('222222222222211111creating notification');
      console.log('erwrwr', inputs.notifications.issue);
      if (inputs.notifications.issue) {
        console.log('0000');

        core.debug(`Notification: Issue`);
        await createComment(result, inputs.notifications.token, inputs.notifications.label);
      }
    }

    core.debug(`Checking tolerance`);
    if (!result.passed) {
      core.setFailed(result.summary);
    }
    core.info(result.summary);
    core.info('===');

    core.debug(`Setting outputs`);
    core.setOutput('passed', result.passed ? 'true' : 'false');

    core.debug(`Done`);
  } catch (error) {
    core.debug(`Error: ${error}`);
    core.setFailed(error.message);
  }
}

run();
