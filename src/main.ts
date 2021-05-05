import * as core from '@actions/core';
import * as github from '@actions/github';
import fs from 'fs';
import {parseInputs} from './inputs';
import {processDiff} from './processing';
import {createRun, createComment} from './notifications';

async function run(): Promise<void> {
  try {
    core.debug(`Parsing inputs`);
    const inputs = parseInputs(core.getInput);
    console.log("inputs", inputs)
    core.debug(`Calculate result`);
    const result = processDiff(inputs.old, inputs.new, inputs.mode, inputs.tolerance);

    if (inputs.notifications) {
      core.debug(`Setting up OctoKit`);
      const octokit = new github.GitHub(inputs.notifications.token);

      if (inputs.notifications.check) {
        core.debug(`Notification: Check Run`);
        await createRun(octokit, github.context, result, inputs.notifications.label);
      }
      if (inputs.notifications.issue) {
        core.debug(`Notification: Issue`);
        const issueId = github.context.issue.number;
        if (issueId || issueId === 0) {
          await createComment(octokit, github.context, result, inputs.notifications.label);
        } else {
          core.debug(`Notification: no issue id`);
        }
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
