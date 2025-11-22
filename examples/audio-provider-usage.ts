/**
 * Audio Provider Usage Examples
 *
 * These examples demonstrate the provider-agnostic audio system.
 * ALL code works identically with OpenVoice OR ElevenLabs!
 */

import { audioService } from '../services/audioService'
import { AudioProviderType } from '../types/audioProvider'

// ========================================================================================
// Example 1: Clone a Character Voice
// ========================================================================================

async function exampleCloneVoice() {
  console.log('=== Example 1: Clone Character Voice ===')

  // Upload a voice sample (6+ seconds for best quality)
  const voiceSampleFile = new File(
    [
      /* audio blob */
    ],
    'john_voice.mp3',
    {
      type: 'audio/mpeg',
    }
  )

  try {
    // Clone voice - works with OpenVoice OR ElevenLabs
    const characterVoice = await audioService.cloneCharacterVoice(
      'character-john-123',
      'John Smith',
      voiceSampleFile,
      'Lead character - British accent, deep authoritative voice'
    )

    console.log('Voice cloned successfully!')
    console.log('Voice ID:', characterVoice.voiceId)
    console.log('Provider:', characterVoice.provider)
    console.log('Quality:', `${characterVoice.cloneMetadata?.quality}%`)
    console.log('Reference audio:', characterVoice.referenceAudio)

    return characterVoice
  } catch (error) {
    console.error('Voice cloning failed:', error)
    throw error
  }
}

// ========================================================================================
// Example 2: Generate Dialogue with Emotion
// ========================================================================================

async function exampleGenerateDialogue(characterVoice: any) {
  console.log('\n=== Example 2: Generate Dialogue with Emotion ===')

  const dialogueLines = [
    { text: "I can't believe you did that!", emotion: 'angry' },
    { text: 'Everything will be okay, I promise.', emotion: 'calm' },
    { text: 'Did you hear that sound?', emotion: 'surprised' },
    { text: "I'm so sorry for what happened.", emotion: 'sad' },
  ]

  const generatedDialogue = []

  for (const line of dialogueLines) {
    try {
      // Generate dialogue - works with OpenVoice OR ElevenLabs
      const dialogue = await audioService.generateCharacterDialogue(
        characterVoice,
        line.text,
        line.emotion,
        'Scene 5: The Confrontation'
      )

      console.log(`Generated: "${line.text}" [${line.emotion}]`)
      console.log('Audio URL:', dialogue.outputAudio)
      console.log('Processing time:', `${dialogue.processingTime}ms`)

      generatedDialogue.push(dialogue)
    } catch (error) {
      console.error(`Failed to generate: "${line.text}"`, error)
    }
  }

  return generatedDialogue
}

// ========================================================================================
// Example 3: Edit Dialogue Emotion
// ========================================================================================

async function exampleEditEmotion(originalAudioUrl: string, characterVoice: any) {
  console.log('\n=== Example 3: Edit Dialogue Emotion ===')

  try {
    // Original dialogue was "angry", let's change it to "sad"
    const editedAudio = await audioService.editDialogueEmotion(
      originalAudioUrl,
      'sad', // New emotion
      "I can't believe you did that!",
      characterVoice
    )

    console.log('Emotion edited successfully!')
    console.log('Original:', originalAudioUrl)
    console.log('Edited:', editedAudio.audioUrl)
    console.log('Processing time:', `${editedAudio.metadata?.processingTime}ms`)

    return editedAudio
  } catch (error) {
    console.error('Emotion editing failed:', error)
    throw error
  }
}

// ========================================================================================
// Example 4: Get Available Voices
// ========================================================================================

async function exampleGetVoices() {
  console.log('\n=== Example 4: Get Available Voices ===')

  try {
    // Get all voices - built-in + custom cloned voices
    const voices = await audioService.getVoices()

    console.log(`Found ${voices.length} voices:`)

    voices.forEach((voice) => {
      console.log('\n---')
      console.log('Name:', voice.name)
      console.log('Language:', voice.language)
      console.log('Gender:', voice.gender)
      console.log('Custom:', voice.isCustom ? 'Yes (Cloned)' : 'No (Built-in)')
      console.log('Quality:', `${voice.metadata?.quality}%`)
    })

    return voices
  } catch (error) {
    console.error('Failed to fetch voices:', error)
    throw error
  }
}

// ========================================================================================
// Example 5: Switch Providers at Runtime
// ========================================================================================

async function _exampleSwitchProviders() {
  console.log('\n=== Example 5: Switch Providers at Runtime ===')

  // Get current configuration
  const config = audioService.getConfiguration()
  console.log('Current provider:', config.active)

  try {
    if (config.active === AudioProviderType.OPENVOICE) {
      // Switch to ElevenLabs
      console.log('\nSwitching to ElevenLabs...')

      await audioService.switchProvider(AudioProviderType.ELEVENLABS, {
        provider: AudioProviderType.ELEVENLABS,
        apiKey: process.env.VITE_ELEVENLABS_API_KEY || '',
        baseUrl: 'https://api.elevenlabs.io',
      })

      console.log('✅ Now using ElevenLabs!')
    } else {
      // Switch to OpenVoice
      console.log('\nSwitching to OpenVoice...')

      await audioService.switchProvider(AudioProviderType.OPENVOICE, {
        provider: AudioProviderType.OPENVOICE,
        baseUrl: process.env.VITE_OPENVOICE_API_URL || 'http://localhost:8000',
      })

      console.log('✅ Now using OpenVoice!')
    }

    // Verify new provider is active
    const newConfig = audioService.getConfiguration()
    console.log('Active provider:', newConfig.active)
  } catch (error) {
    console.error('Provider switch failed:', error)
    throw error
  }
}

// ========================================================================================
// Example 6: Check Provider Status
// ========================================================================================

async function exampleCheckProviderStatus() {
  console.log('\n=== Example 6: Check Provider Status ===')

  try {
    // Check which providers are available
    const status = await audioService.getProviderStatus()

    console.log('Provider availability:')
    console.log(
      'OpenVoice:',
      status[AudioProviderType.OPENVOICE] ? '✅ Available' : '❌ Unavailable'
    )
    console.log(
      'ElevenLabs:',
      status[AudioProviderType.ELEVENLABS] ? '✅ Available' : '❌ Unavailable'
    )

    return status
  } catch (error) {
    console.error('Status check failed:', error)
    throw error
  }
}

// ========================================================================================
// Example 7: Complete Workflow (Clone → Generate → Edit)
// ========================================================================================

async function _exampleCompleteWorkflow() {
  console.log('\n=== Example 7: Complete Workflow ===')

  try {
    // Step 1: Clone character voice
    console.log('Step 1: Cloning voice...')
    const characterVoice = await exampleCloneVoice()

    // Step 2: Generate dialogue
    console.log('\nStep 2: Generating dialogue...')
    const generatedDialogue = await exampleGenerateDialogue(characterVoice)

    // Step 3: Edit emotion of first dialogue
    console.log('\nStep 3: Editing emotion...')
    if (!generatedDialogue[0].outputAudio) throw new Error('No output audio generated')
    const editedAudio = await exampleEditEmotion(generatedDialogue[0].outputAudio, characterVoice)

    console.log('\n✅ Workflow complete!')
    console.log('Voice cloned:', characterVoice.voiceId)
    console.log('Dialogue generated:', generatedDialogue.length)
    console.log('Emotion edited:', editedAudio.audioUrl)

    return {
      characterVoice,
      generatedDialogue,
      editedAudio,
    }
  } catch (error) {
    console.error('Workflow failed:', error)
    throw error
  }
}

// ========================================================================================
// Run All Examples
// ========================================================================================

export async function runAllExamples() {
  console.log('╔════════════════════════════════════════════╗')
  console.log('║  Audio Provider Usage Examples            ║')
  console.log('║  Works with OpenVoice OR ElevenLabs!      ║')
  console.log('╚════════════════════════════════════════════╝\n')

  try {
    // Check provider status
    await exampleCheckProviderStatus()

    // Clone a voice
    const characterVoice = await exampleCloneVoice()

    // Generate dialogue
    const generatedDialogue = await exampleGenerateDialogue(characterVoice)

    // Edit emotion
    if (!generatedDialogue[0].outputAudio) throw new Error('No output audio generated')
    await exampleEditEmotion(generatedDialogue[0].outputAudio, characterVoice)

    // Get voices
    await exampleGetVoices()

    // (Optional) Switch providers
    // await exampleSwitchProviders();

    console.log('\n╔════════════════════════════════════════════╗')
    console.log('║  All examples completed successfully!     ║')
    console.log('╚════════════════════════════════════════════╝')
  } catch (error) {
    console.error('\n❌ Examples failed:', error)
  }
}

// ========================================================================================
// Usage in Your App
// ========================================================================================

/*
// In your React component:

import { runAllExamples } from './examples/audio-provider-usage';

function TestAudioProviders() {
  const handleTest = async () => {
    await runAllExamples();
  };

  return (
    <button onClick={handleTest}>
      Test Audio Providers
    </button>
  );
}
*/

// ========================================================================================
// Key Takeaway
// ========================================================================================

/*
ALL of these examples work IDENTICALLY with:
- OpenVoice (free, CPU-based)
- ElevenLabs (premium, cloud-hosted)

Switch between them by:
1. Changing VITE_AUDIO_PROVIDER environment variable, OR
2. Calling audioService.switchProvider() at runtime

NO CODE CHANGES NEEDED! 🎉
*/
