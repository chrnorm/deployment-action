# deployment-action

A GitHub action to create [Deployments](https://developer.github.com/v3/repos/deployments/) as part of your GitHub CI workflows.

## Required Permissions

\*\*Important: you must grant your GitHub Actions workflow deployment permissions as shown below. Otherwise, this Action will not work.

```yaml
jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest

    permissions:
      deployments: write

    # ...
```

## Example usage

```yaml
name: Deploy

on: [push]

jobs:
  deploy:
    name: Deploy my app

    runs-on: ubuntu-latest

    permissions:
      deployments: write

    steps:
      - uses: actions/checkout@v1

      - uses: chrnorm/deployment-action@v2
        name: Create GitHub deployment
        id: deployment
        with:
          token: '${{ github.token }}'
          environment-url: http://my-app-url.com
          environment: production
        # more steps below where you run your deployment scripts inside the same action
```

## Action inputs

| name                     | description                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initial-status`         | (Optional) Initial status for the deployment. Must be one of the [accepted strings](https://developer.github.com/v3/repos/deployments/#create-a-deployment-status)                                                                                                                                                                                                                                            |
| `repo`                   | (Optional) A custom repository to create the deployment for. Defaults to the repo the action is running in.                                                                                                                                                                                                                                                                                                   |
| `owner`                  | A custom owner to create the deployment for. Defaults to the repo owner the action is running in.                                                                                                                                                                                                                                                                                                             |
| `token`                  | GitHub token                                                                                                                                                                                                                                                                                                                                                                                                  |
| `log-url`                | (Optional) Sets the URL for deployment output                                                                                                                                                                                                                                                                                                                                                                 |
| `description`            | (Optional) Descriptive message about the deployment                                                                                                                                                                                                                                                                                                                                                           |
| `environment`            | (Optional - default is `production`) Name for the target deployment environment                                                                                                                                                                                                                                                                                                                               |
| `environment-url`        | (Optional) Sets the URL for accessing your environment                                                                                                                                                                                                                                                                                                                                                        |
| `auto-merge`             | (Optional - default is `false`) Whether to attempt to auto-merge the default branch into the branch that the action is running on if set to `"true"`. More details in the [GitHub deployments API](https://developer.github.com/v3/repos/deployments/#parameters-1). Warning - setting this to `"true"` has caused this action to [fail in some cases](https://github.com/chrnorm/deployment-action/issues/1) |
| `ref`                    | (Optional - default is `GITHUB_HEAD_REF` if set and `GITHUB_REF` otherwise) The ref to deploy. This can be a branch, tag, or SHA. More details in the [GitHub deployments API](https://developer.github.com/v3/repos/deployments/#parameters-1).                                                                                                                                                              |
| `sha`                    | (Optional) The SHA recorded at creation time. More details in the [GitHub deployments API](https://developer.github.com/v3/repos/deployments/#parameters-1).                                                                                                                                                                                                                                                  |
| `task`                   | (Optional) The name of the task for the deployment (e.g., `deploy` or `deploy:migrations`). Defaults to `deploy`. More details in the [GitHub deployments API](https://developer.github.com/v3/repos/deployments/#parameters-1).                                                                                                                                                                              |
| `required-contexts`      | (Optional) If provided, must be formatted as a comma-separated string. The status contexts to verify against commit status checks. If you omit this parameter, GitHub verifies all unique contexts before creating a deployment. To bypass checking entirely, pass an empty array. Defaults to all unique contexts.                                                                                           |
| `payload`                | (Optional) JSON payload with extra information about the deployment. Can be provided as a JSON string.                                                                                                                                                                                                                                                                                                        |
| `transient-environment`  | (Optional) Specifies if the given environment is specific to the deployment and will no longer exist at some point in the future.                                                                                                                                                                                                                                                                             |
| `production-environment` | (Optional) Specifies if the given environment is one that end-users directly interact with. Default: true when environment is production and false otherwise.                                                                                                                                                                                                                                                 |
| `auto-inactive`          | (Optional) Adds a new inactive status to all prior non-transient, non-production environment deployments with the same repository and environment name as the created status's deployment. An inactive status is only added to deployments that had a success state. Default: true                                                                                                                            |
| `github-base-url`        | (Optional) Changes the API base URL for a GitHub Enterprise server.                                                                                                                                                                                                                                                                                                                                           |

## Action outputs

| name              | description                                                            |
| ----------------- | ---------------------------------------------------------------------- |
| `deployment_id`   | The ID of the deployment as returned by the GitHub API                 |
| `deployment_url`  | The URL of the created deployment                                      |
| `environment_url` | The environment URL of the deployment (the same as the input variable) |

## Notes

Heads up! Currently, there is a GitHub Actions limitation where events fired _inside_ an action will not trigger further workflows. If you use this action in your workflow, it will **not trigger** any "Deployment" workflows. Thanks to @rclayton-the-terrible for finding a workaround for this:

> While not ideal, if you use a token that is not the Action's GITHUB_TOKEN, this will work. I define a secret called GITHUB_DEPLOY_TOKEN and use that for API calls.

A workaround for this is to create the Deployment, perform the deployment steps, and then trigger an action to create a Deployment Status using my other action: [chrnorm/deployment-status](https://github.com/chrnorm/deployment-status).

For example:

```yaml
name: Deploy

on: [push]

jobs:
  deploy:
    name: Deploy my app

    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v1

      - uses: chrnorm/deployment-action@v2
        name: Create GitHub deployment
        id: deployment
        with:
          token: '${{ github.token }}'
          environment-url: http://my-app-url.com
          environment: production

      - name: Deploy my app
        run: |
          # add your deployment code here

      - name: Update deployment status (success)
        if: success()
        uses: chrnorm/deployment-status@v2
        with:
          token: '${{ github.token }}'
          environment-url: ${{ steps.deployment.outputs.environment_url }}
          deployment-id: ${{ steps.deployment.outputs.deployment_id }}
          state: 'success'

      - name: Update deployment status (failure)
        if: failure()
        uses: chrnorm/deployment-status@v2
        with:
          token: '${{ github.token }}'
          environment-url: ${{ steps.deployment.outputs.environment_url }}
          deployment-id: ${{ steps.deployment.outputs.deployment_id }}
          state: 'failure'
```

## Breaking changes

`v2` of this action removes the `target_url` input and replaces it with the `environment_url` and `log_url` inputs to match GitHub's API. `v2` also standardises on using `kebab-case` rather than `snake_case` for inputs to match GitHub's built-in actions.
