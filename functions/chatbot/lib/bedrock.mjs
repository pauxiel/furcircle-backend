import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

const client = new BedrockRuntimeClient()

const MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0'
const MAX_TOKENS = 1024

export const invokeModel = async (systemPrompt, messages) => {
  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages
    })
  })

  const response = await client.send(command)
  const body = JSON.parse(new TextDecoder().decode(response.body))

  return body.content[0].text
}