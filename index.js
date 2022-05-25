const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const owner = core.getInput('owner', {required: true});
    const repo = core.getInput('repo', {required: true});
    const pr_number = core.getInput('pr_number', {required: true});
    const token = core.getInput('token ', {required: true});

    const octokit = github.getOktokit(token);

    const { data: changedFiles } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pr_number,
    });

    let diffData = {
      additions: 0,
      deletions: 0,
      changes: 0
    };

    diffData = changedFiles.reduce((acc, file) => {
      acc.additions += file.additions;
      acc.deletions += file.deletions;
      acc.changes += file.changes;
      return acc;
    }, diffData);

    await octokit.rest.issue.createComment({
      owner,
      repo,
      issue_number: pr_number,
      body: 
        `Pull request #${pr_number} has be updated with: \n
        -${diffData.changes} changes \n
        -${diffData.additions} additions \n
        -${diffData.deletions} deletions \n`
    });
    
    const labels = [];
    changedFiles.map((file) => {
      const fileExtension = file.filename.split('.').pop();
      switch(fileExtension) {
        case 'md':
          labels.push('markdown');
          break
        case 'js':
          labels.push('javascript');
          break
        case 'yml':
          labels.push('yaml');
          break
        case 'yaml':
          labels.push('yaml');
          break
        default:
          labels.push('unknown');
      }
      
    });
    await octokit.rest.issues.addLabel({
      owner,
      repo,
      issue_number: pr_number,
      labels
    });
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
