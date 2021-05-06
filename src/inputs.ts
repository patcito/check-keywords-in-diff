import {InputOptions} from '@actions/core';
import * as Inputs from './namespaces/Inputs';

type GetInput = (name: string, options?: InputOptions | undefined) => string;

export const parseInputs = (getInput: GetInput): Inputs.Args => {
  let notifications;
  const notify_check = getInput('notify_check');
  const notify_issue = getInput('notify_issue');
  if (notify_check || notify_issue) {
    const label = getInput('title');
    const token = getInput('token', {required: true});
    notifications = {
      token,
      label,
      check: notify_check === 'true',
      issue: notify_issue === 'true',
    };
  }

  return {
    notifications,
  };
};
