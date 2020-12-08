import * as core from "@actions/core";
import * as github from "@actions/github";

type DeploymentState =
  | "error"
  | "failure"
  | "inactive"
  | "in_progress"
  | "queued"
  | "pending"
  | "success";

async function run() {
  try {
    const context = github.context;
    const defaultLogUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`;

    const token = core.getInput("token", { required: true });
    const ref = core.getInput("ref", { required: false }) || context.ref;
    const logUrl = core.getInput("log_url", { required: false }) || core.getInput("target_url", { required: false }) || defaultLogUrl;
    const environment =
      core.getInput("environment", { required: false }) || "production";
    const description = core.getInput("description", { required: false });
    const environmentUrl =
      core.getInput("environment_url", { required: false }) || "";
    const initialStatus =
      (core.getInput("initial_status", {
        required: false
      }) as DeploymentState) || "pending";
    const autoMergeStringInput = core.getInput("auto_merge", {
      required: false
    });

    const auto_merge: boolean = autoMergeStringInput === "true";

    const client = new github.GitHub(token, { previews: ["flash", "ant-man"] });

    const deployment = await client.repos.createDeployment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: ref,
      required_contexts: [],
      environment,
      transient_environment: true,
      auto_merge,
      description
    });

    await client.repos.createDeploymentStatus({
      ...context.repo,
      deployment_id: deployment.data.id,
      state: initialStatus,
      log_url: logUrl,
      environment_url: environmentUrl
    });

    core.setOutput("deployment_id", deployment.data.id.toString());
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run();
