import github from '@actions/github';
import {Result} from './processing';
import {Context} from '@actions/github/lib/context';
import { context } from '@actions/github/lib/utils';

const formatDate = (): string => {
  return new Date().toISOString();
};

const getTitle = (label?: string): string => {
  const more = label ? ` (${label})` : '';
  return `Smart Diff${more}`;
};

export const createRun = async (context: Context, result: Result, 
 token: string,
  
  label?: string): Promise<void> => {
  const title = getTitle(label);
  const octokit =   await github.getOctokit(token)

  await octokit.checks.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    head_sha: context.sha,
    status: 'completed',
    conclusion: result.passed ? 'success' : 'failure',
    name: title,
    started_at: formatDate(),
    completed_at: formatDate(),
    output: {
      title,
      summary: result.summary,
    },
  });
};

export const createComment = async (
  result: Result,
 token: string,
  label?: string,
): Promise<void> => {
  console.log("creating notification")

const okto =   await github.getOctokit(token)
const context = await github.context

  const { data: PullRequest } = await okto.rest.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    head_sha: context.sha,
});
console.log("FOUDN PULL REQUEST", PullRequest)
  /*await octokit.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    body: `## ${getTitle(label)}: ${result.passed ? 'Success' : 'Warning'}
${result.summary}
`,
  });*/
};
