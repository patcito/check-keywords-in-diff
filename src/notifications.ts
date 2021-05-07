import github, {getOctokit} from '@actions/github';
import {Result} from './processing';
import {Context} from '@actions/github/lib/context';
import {context, GitHub} from '@actions/github/lib/utils';

const formatDate = (): string => {
  return new Date().toISOString();
};

const getTitle = (label?: string): string => {
  const more = label ? ` (${label})` : '';
  return `Important changes detected ${more}`;
};

export const createRun = async (
  context: Context,
  result: Result,
  token: string,

  label?: string,
): Promise<void> => {
  const title = getTitle(label);
  const octokit = await getOctokit(token);

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

export const createComment = async (result: Result, token: string, label?: string): Promise<void> => {
  const okto = await getOctokit(token);
  const ref = context.ref.split('/')[context.ref.split('/').length - 1];
  let owner = context.repo.owner;
  let repo = context.repo.repo;
  if (context.payload.pull_request?.base?.repo?.owner?.login) {
    owner = context.payload.pull_request?.base?.repo?.owner?.login;
    repo = context.payload.pull_request?.base?.repo?.name;
  }
  const pulls = okto.pulls.list({
    owner: owner,
    repo: repo,
    state: 'open',
    request: {
      head: ref,
    },
  });
  console.log('ref', ref);
  console.log(
    'payload',
    context.payload.pull_request?.base?.repo?.owner?.login,
    '/',
    context.payload.pull_request?.base?.repo?.name,
  );
  console.log('context', context);
  /*
  const { data: PullRequest } = await okto.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: 1,
   request: {

   } 
  })*/
  /*{
    owner: context.repo.owner,
    repo: context.repo.repo,
    head_sha: context.sha,
}*/
  //https://vaults.finance/all

  const x = (await pulls).data;
  if (result.passed) {
    x.forEach(async issue => {
      if (issue?.head?.ref === ref) {
        const {data: PullRequest} = await okto.pulls.get({
          owner: owner,
          repo: repo,
          pull_number: issue.number,
        });

        await okto.issues.createComment({
          owner: owner,
          repo: repo,
          issue_number: issue.number,
          body: `## ${getTitle(label)}
${result.summary}
`,
        });
      }
    });
  }
};
