## Gitea Actions

This repository uses Gitea Actions to build and deploy the frontend through manual workflow runs.

### Required repository secret

Create the repository secret `DEPLOY_SSH_KEY_B64` in Gitea and set it to the base64 content of the private key that can log in to:

- `voltage@192.168.30.10`

The workflow will:

1. Run `npm ci`
2. Run `npm run build`
3. Clear `/opt/iotcloud/front/disk`
4. Upload every file and directory from `dist/` into `/opt/iotcloud/front/disk`

### Notes

- The workflow file is `.gitea/workflows/deploy.yml`
- The workflow only runs from `workflow_dispatch`
- The current runner label is `ubuntu-latest`; if your Gitea runner uses a different label, update `runs-on`
- Store the key as base64 to avoid newline/format issues in the Gitea secret input
