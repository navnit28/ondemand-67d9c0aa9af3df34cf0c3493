
const axios = require('axios');

// Replace these placeholders with actual values
const API_KEY = '<replace_api_key>';
const EXTERNAL_USER_ID = '<replace_external_user_id>';
const QUERY = 'Put your query here';
const PLUGIN_IDS = [
  'plugin-1712327325',
  'plugin-1713962163',
  'plugin-1742213706',
  'plugin-1713954536',
  'plugin-1713958591',
  'plugin-1713958830',
  'plugin-1713961903',
  'plugin-1713967141'
];
const ENDPOINT_ID = 'predefined-openai-gpt4o';
const REASONING_MODE = 'medium';
const RESPONSE_MODE = 'sync'; // Change to 'stream' for SSE

// Create Chat Session
async function createChatSession() {
  try {
    const response = await axios.post(
      'https://api.on-demand.io/chat/v1/sessions',
      {
        pluginIds: [],
        externalUserId: EXTERNAL_USER_ID
      },
      {
        headers: {
          apikey: API_KEY
        }
      }
    );

    if (response.status === 201) {
      console.log('Chat session created successfully:', response.data);
      return response.data.data.id; // Extract session ID
    } else {
      throw new Error('Failed to create chat session');
    }
  } catch (error) {
    console.error('Error creating chat session:', error.message);
    throw error;
  }
}

// Submit Query
async function submitQuery(sessionId) {
  try {
    if (RESPONSE_MODE === 'sync') {
      // Handle synchronous response
      const response = await axios.post(
        `https://api.on-demand.io/chat/v1/sessions/${sessionId}/query`,
        {
          endpointId: ENDPOINT_ID,
          query: QUERY,
          pluginIds: PLUGIN_IDS,
          responseMode: RESPONSE_MODE,
          reasoningMode: REASONING_MODE
        },
        {
          headers: {
            apikey: API_KEY
          }
        }
      );

      if (response.status === 200) {
        console.log('Query response:', response.data);
      } else {
        throw new Error('Failed to submit query');
      }
    } else if (RESPONSE_MODE === 'stream') {
      // Handle Server-Sent Events (SSE)
      const url = `https://api.on-demand.io/chat/v1/sessions/${sessionId}/query`;
      const headers = {
        apikey: API_KEY,
        'Content-Type': 'application/json'
      };
      const body = {
        endpointId: ENDPOINT_ID,
        query: QUERY,
        pluginIds: PLUGIN_IDS,
        responseMode: RESPONSE_MODE,
        reasoningMode: REASONING_MODE
      };

      const source = new axios.CancelToken.source();

      const eventStream = await axios.post(url, body, {
        headers,
        responseType: 'stream',
        cancelToken: source.token
      });

      eventStream.data.on('data', (chunk) => {
        const data = chunk.toString();
        console.log('SSE Data:', data);
      });

      eventStream.data.on('end', () => {
        console.log('SSE stream ended');
      });

      eventStream.data.on('error', (error) => {
        console.error('SSE stream error:', error.message);
        source.cancel('SSE stream canceled due to error');
      });
    }
  } catch (error) {
    console.error('Error submitting query:', error.message);
    throw error;
  }
}

// Main function to execute the flow
async function main() {
  try {
    const sessionId = await createChatSession();
    await submitQuery(sessionId);
  } catch (error) {
    console.error('Error in main flow:', error.message);
  }
}

main();
