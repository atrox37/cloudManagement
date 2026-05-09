## Gitea Actions

This repository uses Gitea Actions to build and deploy the frontend through manual workflow runs.

### Required repository secret

Create the repository secret `DEPLOY_SSH_KEY` in Gitea and set it to the private key content that can log in to:

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
- If the private key was pasted from Windows, keep the content unchanged in Gitea; the workflow normalizes line endings before use
