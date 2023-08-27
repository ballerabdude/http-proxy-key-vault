# HTTP Proxy Server with Azure Key Vault Integration

This Node.js application acts as a proxy server that fetches secrets from Azure Key Vault and injects them as headers into proxied HTTP requests.

## Prerequisites

Node.js and npm installed
An Azure Key Vault instance with secrets set up
Appropriate Azure credentials to access the Key Vault
## Setup

Navigate to the directory containing your proxy.js and package.json.
Install dependencies:
```
npm install
```
## Running Locally

To run the app locally and simulate Azure Key Vault behavior using environment variables:

Set environment variables:
```
export TARGET_URL="https://your-target-url.com"
export SECRET_PREFIX="myapp-"
export KEYVAULT_URL="mock-keyvault-url"
export DEBUG_MODE="true"
export myapp_authorization="Bearer token123"
```

Start the server:
```
npm start
```

Note: In this local demonstration, we're using environment variables to mock the behavior of fetching secrets from Azure Key Vault.