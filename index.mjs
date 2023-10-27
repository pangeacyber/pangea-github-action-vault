import core from '@actions/core';
import github from '@actions/github';
import sodium from 'libsodium-wrappers';
import {
  PangeaConfig,
  VaultService,
  PangeaErrors,
  Vault,
} from "pangea-node-sdk";

// most @actions toolkit packages have async methods
async function run() {
  try {
    const githubToken = core.getInput('github_token');
    const pangeaToken = core.getInput('pangea_token');
    const pangeaDomain = core.getInput('pangea_domain')
    const defaultFolderPath = core.getInput('pangea_default_folder')
    const octokit = github.getOctokit(githubToken);

    const context = github.context

    // Initialize pangea
    const config = new PangeaConfig({ domain: pangeaDomain });
    const vault = new VaultService(pangeaToken, config);

    // Used to encrypt secrets with
    
    const publicKey = await octokit.rest.actions.getRepoPublicKey({
      ...context.repo
    });

    const keyID = publicKey.data.key_id
    const pubKey = publicKey.data.key
    

    sodium.ready.then(async () => {
        const secretsObj = await getSecretsFromPangea(vault, defaultFolderPath).catch(err => {
          console.error("Error getting secrets from Pangea: \t", err);
        });

        for(let secretIndex in secretsObj) {
          // Convert Secret & Base64 key to Uint8Array.
          let binkey = sodium.from_base64(pubKey, sodium.base64_variants.ORIGINAL)
          let binsec = sodium.from_string(secretsObj[secretIndex].value)
        
          //Encrypt the secret using LibSodium
          let encBytes = sodium.crypto_box_seal(binsec, binkey)
        
          // Convert encrypted Uint8Array to Base64
          let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)

          // Sync each secret
          await octokit.rest.actions.createOrUpdateRepoSecret({
            ...context.repo,
            secret_name: secretsObj[secretIndex].name,
            encrypted_value: output,
            key_id: keyID
          })
        }

    });
    
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

const getSecretsFromPangea = async (vault, defaultFolderPath) => {
  const response = await vault.list(
    {
      filter: {
        folder: defaultFolderPath,
      },
      order: Vault.ItemOrder.ASC,
      include_secrets: true,
    }
  );


  let rawSecretList = response.result.items
  let extractedData = []
  
  for (let secretItem of rawSecretList) {
    // Fetch pub key material if type is asymmetric_key
    if (secretItem.type == "asymmetric_key") {
      const { id } = secretItem;
      const secretResp = await vault.getItem(
      id,
        {
          version_state: Vault.ItemVersionState.ACTIVE
        }
      )

      if ("current_version" in secretItem) {
        // Setting public key as a secret
        secretItem.current_version.secret = secretResp.result.current_version.public_key
      }
    }
    
    if ("current_version" in secretItem && "secret" in secretItem.current_version) {
      extractedData.push({
        "name": secretItem.name, 
        "value": secretItem.current_version.secret
      })
    }
  }

  return extractedData;
}

run();
