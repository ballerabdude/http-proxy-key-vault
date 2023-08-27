const { DefaultAzureCredential, WorkloadIdentityCredential, AzureCliCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();

const targetUrl = process.env.TARGET_URL;
const secretPrefix = process.env.SECRET_PREFIX;
const keyVaultUrl = process.env.KEYVAULT_URL;
const debugMode = process.env.DEBUG_MODE === 'true';

if (!targetUrl || !secretPrefix || !keyVaultUrl) {
    console.error('Please set all required environment variables.');
    process.exit(1);
}

// Middleware to handle request parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to log requests if debug mode is enabled
if (debugMode) {
    app.use((req, res, next) => {
        console.log(`Received ${req.method} request on path ${req.path}`);
        console.log('Headers:', JSON.stringify(req.headers));
        if (req.body && Object.keys(req.body).length > 0) {
            console.log('Body:', JSON.stringify(req.body));
        }
        next();
    });
}

const fetchHeadersFromSecrets = async () => {
    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(keyVaultUrl, credential);
    
    const secrets = await secretClient.listPropertiesOfSecrets();
    const headers = {};

    for await (const secret of secrets) {
        if (secret.name.startsWith(secretPrefix)) {
            const headerValue = (await secretClient.getSecret(secret.name)).value;
            const headerName = secret.name.replace(secretPrefix, '').replace(/-/g, '-');
            headers[headerName] = headerValue;

            if (debugMode) {
                console.log(`Fetched header ${headerName} with value ${headerValue} from secret ${secret.name}`);
            }
        }
    }

    return headers;
};

app.all('*', async (req, res) => {
    try {
        const customHeaders = await fetchHeadersFromSecrets();

        const response = await axios({
            method: req.method,
            url: targetUrl + req.url,
            headers: {
                ...req.headers,
                ...customHeaders
            },
            data: req.body,
            httpsAgent: new (require('https').Agent)({
                rejectUnauthorized: false
            })
        });

        if (debugMode) {
            console.log(`Forwarded ${req.method} request to ${targetUrl + req.url}`);
            console.log('Received response with status:', response.status);
            console.log('Response headers:', JSON.stringify(response.headers));
            console.log('Response body:', JSON.stringify(response.data));
        }

        res.status(response.status).send(response.data);
    } catch (error) {
        // console.log(error)
        if (error.response) {
            if (debugMode) {
                console.error('Error response from target:', JSON.stringify(error.response.data));
            }
            res.status(error.response.status).send(error.response.data);
        } else {
            if (debugMode) {
                console.error('Proxy error:', error.message);
            }
            res.status(500).send('Proxy error');
        }
    }
});

app.listen(3001, () => {
    console.log('Proxy server started on port 3001');
});
