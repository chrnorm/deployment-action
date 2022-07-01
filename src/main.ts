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

    const baseUrl =
      core.getInput('github-base-url', {required: false}) || undefined

    const token = core.getInput('token', {required: true})
    const octokit = github.getOctokit(token, {baseUrl})

    const owner =
      core.getInput('owner', {required: false}) || context.repo.owner
    const repo = core.getInput('repo', {required: false}) || context.repo.repo

    const headRef = process.env.GITHUB_HEAD_REF
    const ref =
      core.getInput('ref', {required: false}) || headRef || context.ref

    const sha = core.getInput('sha', {required: false}) || context.sha

    const logUrl = core.getInput('log-url', {required: false}) || defaultLogUrl

    const environmentUrl = core.getInput('environment-url', {required: false})

    const task = core.getInput('task', {
      required: false
    })

    const payload = core.getInput('payload', {
      required: false
    })
    const autoInactiveStringInput = core.getInput('auto-inactive', {
      required: false
    })

    const autoInactive: boolean = autoInactiveStringInput === 'true'

    const transientEnvironment = core.getInput('transient-environment', {
      required: false
    })

    const productionEnvironmentStringInput =
      core.getInput('production-environment', {
        required: false
      }) || undefined

    const productionEnvironment = productionEnvironmentStringInput
      ? productionEnvironmentStringInput === 'true'
      : undefined

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
      owner,
      repo,
      ref,
      sha,
      task: task !== '' ? task : undefined,
      required_contexts: requiredContexts ? requiredContexts.split(',') : [],
      environment,
      transient_environment: transientEnvironment === 'true',
      production_environment: productionEnvironment,
      auto_merge: autoMerge === 'true',
      payload: payload ? tryParseJSON(payload) : undefined,
      description
    })

    if (!('id' in deployment.data)) {
      // TODO: Should 202 be handled differently? Either way we get no ID
      throw new Error(deployment.data.message)
    }

    await octokit.rest.repos.createDeploymentStatus({
      owner,
      repo,
      deployment_id: deployment.data.id,
      description,
      state: initialStatus,
      log_url: logUrl,
      environment_url: environmentUrl,
      auto_inactive: autoInactive
    })

    core.setOutput('deployment_id', deployment.data.id.toString())
    core.setOutput('deployment_url', deployment.data.url)
    core.setOutput('environment_url', environmentUrl)
  } catch (error: any) {
    core.error(error)
    core.setFailed(`Error creating GitHub deployment: ${error.message}`)
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
