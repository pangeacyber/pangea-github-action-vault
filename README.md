# Use Secrets from Pangea Vault in GitHub Actions

Use this action to fetch secrets from [Pangea Vault](https://pangea.cloud/services/vault?utm_source=github&utm_medium=readme&utm_campaign=pangea-github-action-vault) and load them securely into your GitHub actions pipelines. To use this action, a Pangea account is required.

To get a Pangea account [Sign up for free](https://pangea.cloud/signup)

## How it Works
Pangea is a collection of security services, all API-based, that can quickly and easily be added to any cloud application, embedded in the runtime code. Pangea provides app builders with a wide selection of security services to enable easily embedding security into their applications. Similar in nature to AWS for Compute APIs, Twilio for Communications APIs, or Stripe for Billing APIs, now there is Pangea for Security APIs.

This action authenticates with Pangea and securely fetches secrets from Pangea and injects them into the runtime envrionments of GitHub actions.

## Set up Pangea
To configure Pangea:
1. Get your PANGEA_TOKEN and PANGEA_DOMAIN from [the getting started guide](https://pangea.cloud/docs/vault/getting-started/).
2. When you create your token in the guide, make sure it has access to Vault
3. Store your app secrets in a folder and note down the folder path where the app secrets are stored
4. Create a new GitHub personal access token with access to the desired repository and give it read and write permissions on the `Environments`. You can create it in [the developer settings](https://github.com/settings/personal-access-tokens/new)
5. Save your PANGEA_TOKEN, PANGEA_DOMAIN, PANGEA_DEFAULT_FOLDER, and SECRETS_PAT (github token) as secrets in your github repo /settings/secrets/actions

## Usage
Note: The way this action is designed, it can only inject secrets in the main branch. To use this action in other branches or without the GitHub personal access token, use the [Call Pangea API action](https://github.com/pangeacyber/pangea-github-action-api)

The action involves 2 steps:
1. Syncing Secrets from Pangea Vault to GitHub Secrets
Create a file `.github/workflows/sync.yml` which contains the following workflow:
```yml
name: Sync

on: [push]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: pangeacyber/pangea-github-action-vault@1.0.1
        with:
          github_token: ${{secrets.SECRET_PAT}}
          pangea_token: ${{secrets.PANGEA_TOKEN}}
          pangea_default_folder: ${{secrets.PANGEA_DEFAULT_FOLDER}}
          pangea_domain: ${{secrets.PANGEA_DOMAIN}}
```

2. Loading secrets into your job runtime
To use your synced secrets in a workflow, copy the `on:` block which makes your jobs run after the secrets are up-to-date. Also, for each job where you want to import secrets in the `env:` block as shown below:
```yml
name: Check Secrets Synced

# Makes sure to run with the synced secrets after the Sync job is completed
on:
  workflow_run:
    workflows: ["Sync"]
    types:
      - completed

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: run your job
        run: <job_command>  # (ex - npm run build)
        env:
          SECRET1: {{ secrets.SECRET1 }}
          SECRET2: {{ secrets.SECRET2 }}
          # ...
          # add all the secrets you want to add into the env as shown above
```

## Examples
[snpranav/my-cool-app](https://github.com/snpranav/my-cool-app) is a great starter app that builds a [Next.js](https://nextjs.org) app with env variables synced with Pangea Vault

## LICENSE
[MIT](./LICENSE)
