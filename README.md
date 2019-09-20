# deployment-action

A GitHub action to create [Deployments](https://developer.github.com/v3/repos/deployments/) as part of your GitHub CI workflows.

Heads up! Currently, there is a GitHub Actions limitation where events fired _inside_ an action will not trigger further workflows. If you use this action in your workflow, it will **not trigger** any "Deployment" workflows.

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

      - uses: chrnorm/deployment-action@releases/v1
        name: Create GitHub deployment
        id: deployment
        with:
          token: "${{ github.token }}"
          target-url: http://my-app-url.com
          environment: production

      - name: Deploy my app
        run: |
          # add your deployment code here

      - name: Update deployment status (success)
        if: success()
        uses: chrnorm/deployment-status@releases/v1
        with:
          token: "${{ github.token }}"
          target-url: http://my-app-url.com
          state: "success"
          deployment_id: ${{ steps.deployment.outputs.deployment_id }}

      - name: Update deployment status (failure)
        if: failure()
        uses: chrnorm/deployment-status@releases/v1
        with:
          token: "${{ github.token }}"
          target-url: http://my-app-url.com
          state: "failure"
          deployment_id: ${{ steps.deployment.outputs.deployment_id }}
```
