import * as core from "@actions/core";
import * as github from "@actions/github";

// type DeploymentState =
//   | "error"
//   | "failure"
//   | "inactive"
//   | "in_progress"
//   | "queued"
//   | "pending"
//   | "success";

async function run() {
  try {
    const context = github.context;
    const defaultUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`;

    const token = core.getInput("token", { required: true });
    // const state = core.getInput("state", { required: true }) as DeploymentState;
    const url = core.getInput("target-url", { required: false }) || defaultUrl;
    const description = core.getInput("description", { required: false });

    const client = new github.GitHub(token);

    const deployment = await client.repos.createDeployment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: context.ref,
      required_contexts: [],
      environment: "development",
      transient_environment: true,
      description
    });

    await client.repos.createDeploymentStatus({
      ...context.repo,
      deployment_id: deployment.data.id,
      state: "pending",
      log_url: defaultUrl,
      target_url: url
    });
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run();
