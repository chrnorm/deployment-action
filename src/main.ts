import * as core from '@actions/core'
import * as github from '@actions/github'

type DeploymentState =
  | 'error'
  | 'failure'
  | 'inactive'
  | 'in_progress'
  | 'queued'
  | 'pending'
  | 'success'

async function run(): Promise<void> {
  try {
    const context = github.context
    const defaultLogUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`

    const token = core.getInput('token', {required: true})
    const octokit = github.getOctokit(token)

    const ref = core.getInput('ref', {required: false}) || context.ref

    const sha = core.getInput('sha', {required: false}) || context.sha

    const logUrl = core.getInput('log-url', {required: false}) || defaultLogUrl

    const environmentUrl = core.getInput('environment-url', {required: false})

    const task = core.getInput('task', {
      required: false
    })

    const payload = core.getInput('payload', {
      required: false
    })

    const transientEnvironment = core.getInput('transient-environment', {
      required: false
    })

    const productionEnvironment = core.getInput('production-environment', {
      required: false
    })

    const environment =
      core.getInput('environment', {required: false}) || 'production'

    const description = core.getInput('description', {required: false})

    const initialStatus =
      (core.getInput('initial-status', {
        required: false
      }) as DeploymentState) || 'pending'

    const autoMerge = core.getInput('auto-merge', {
      required: false
    })

    const requiredContexts = core.getInput('required-contexts', {
      required: false
    })

    const deployment = await octokit.rest.repos.createDeployment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref,
      sha,
      task: task !== '' ? task : undefined,
      required_contexts: requiredContexts ? requiredContexts.split(',') : [],
      environment,
      transient_environment: transientEnvironment === 'true',
      production_environment: productionEnvironment === 'true',
      auto_merge: autoMerge === 'true',
      payload: payload ? tryParseJSON(payload) : undefined,
      description
    })

    if (!('id' in deployment.data)) {
      // TODO: Should 202 be handled differently? Either way we get no ID
      throw new Error(deployment.data.message)
    }

    await octokit.rest.repos.createDeploymentStatus({
      ...context.repo,
      deployment_id: deployment.data.id,
      state: initialStatus,
      log_url: logUrl,
      environment_url: environmentUrl
    })

    core.setOutput('deployment-id', deployment.data.id.toString())
    core.setOutput('deployment-url', deployment.data.url)
  } catch (error: any) {
    core.error(error)
    core.setFailed(error.message)
  }
}

/**
 * helper function to try and parse a provided input string as a JSON object.
 * If it cannot be parsed the input string is returned.
 */
function tryParseJSON(str: string): any {
  let res: any = str
  try {
    res = JSON.parse(str)
  } catch (e) {
    core.info(`couldn't parse string as JSON: ${str}`)
  }
  return res
}

run()
