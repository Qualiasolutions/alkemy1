/**
 * Component Tests for CharacterIdentityTestPanel
 * Story 2.2: Character Identity Preview and Testing
 *
 * Test Coverage:
 * - Rendering when identity is not ready
 * - Generating all tests (batch)
 * - Generating individual tests
 * - Displaying test results
 * - Approval workflow
 * - Error handling
 * - Progress tracking
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as characterIdentityService from '../services/characterIdentityService'
import type { AnalyzedCharacter, CharacterIdentity, CharacterIdentityTest } from '../types'
import { CharacterIdentityTestPanel } from './CharacterIdentityTestPanel'

// Mock the theme context
vi.mock('../theme/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}))

// Mock the character identity service
vi.mock('../services/characterIdentityService', () => ({
  testCharacterIdentity: vi.fn(),
  generateAllTests: vi.fn(),
  approveCharacterIdentity: vi.fn(),
}))

describe('CharacterIdentityTestPanel', () => {
  const mockCharacterWithoutIdentity: AnalyzedCharacter = {
    id: 'char1',
    name: 'Test Character',
    description: 'A test character',
    imageUrl: 'https://example.com/char.jpg',
  }

  const mockIdentity: CharacterIdentity = {
    status: 'ready',
    referenceImages: ['https://example.com/ref1.jpg', 'https://example.com/ref2.jpg'],
    createdAt: '2025-01-01T00:00:00Z',
    lastUpdated: '2025-01-01T00:00:00Z',
    technologyData: {
      type: 'reference',
      falCharacterId: 'fal-char-123',
    },
  }

  const mockCharacterWithIdentity: AnalyzedCharacter = {
    ...mockCharacterWithoutIdentity,
    identity: mockIdentity,
  }

  const mockTest: CharacterIdentityTest = {
    id: 'test-1',
    testType: 'portrait',
    generatedImageUrl: 'https://example.com/generated.jpg',
    similarityScore: 88.5,
    timestamp: '2025-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering States', () => {
    it('should show identity not ready message when identity is missing', () => {
      render(<CharacterIdentityTestPanel character={mockCharacterWithoutIdentity} />)

      expect(screen.getByText('Character Identity Testing')).toBeInTheDocument()
      expect(
        screen.getByText(/Character identity must be trained before testing can begin/)
      ).toBeInTheDocument()
      expect(screen.getByText('Identity not ready for testing')).toBeInTheDocument()
    })

    it('should show identity not ready message when identity status is not ready', () => {
      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: { ...mockIdentity, status: 'preparing' },
      }

      render(<CharacterIdentityTestPanel character={character} />)

      expect(
        screen.getByText(/Character identity must be trained before testing can begin/)
      ).toBeInTheDocument()
    })

    it('should show full testing interface when identity is ready', () => {
      render(<CharacterIdentityTestPanel character={mockCharacterWithIdentity} />)

      expect(
        screen.getByText(`Character Identity Testing - ${mockCharacterWithIdentity.name}`)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Generate test variations to validate character consistency/)
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Generate All Tests/ })).toBeInTheDocument()
    })

    it('should display individual test type buttons', () => {
      render(<CharacterIdentityTestPanel character={mockCharacterWithIdentity} />)

      expect(screen.getByText('Portrait')).toBeInTheDocument()
      expect(screen.getByText('Full Body')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Lighting')).toBeInTheDocument()
      expect(screen.getByText('Expression')).toBeInTheDocument()
    })
  })

  describe('Generate All Tests', () => {
    it('should call generateAllTests when button is clicked', async () => {
      const mockTests: CharacterIdentityTest[] = [
        { ...mockTest, id: 'test-1', testType: 'portrait', similarityScore: 88.5 },
        { ...mockTest, id: 'test-2', testType: 'fullbody', similarityScore: 90.2 },
        { ...mockTest, id: 'test-3', testType: 'profile', similarityScore: 85.1 },
        { ...mockTest, id: 'test-4', testType: 'lighting', similarityScore: 87.8 },
        { ...mockTest, id: 'test-5', testType: 'expression', similarityScore: 89.4 },
      ]

      vi.mocked(characterIdentityService.generateAllTests).mockResolvedValue(mockTests)

      render(<CharacterIdentityTestPanel character={mockCharacterWithIdentity} />)

      const generateButton = screen.getByRole('button', { name: /Generate All Tests/ })
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(characterIdentityService.generateAllTests).toHaveBeenCalledWith({
          characterId: mockCharacterWithIdentity.id,
          identity: mockIdentity,
          onProgress: expect.any(Function),
        })
      })
    })

    it('should display progress during generation', async () => {
      let progressCallback: ((progress: number, status: string) => void) | undefined

      vi.mocked(characterIdentityService.generateAllTests).mockImplementation(
        async ({ onProgress }) => {
          progressCallback = onProgress
          if (progressCallback) {
            progressCallback(20, 'Generating portrait test...')
          }
          return []
        }
      )

      render(<CharacterIdentityTestPanel character={mockCharacterWithIdentity} />)

      const generateButton = screen.getByRole('button', { name: /Generate All Tests/ })
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Generating Tests...')).toBeInTheDocument()
        expect(screen.getByText('Generating portrait test...')).toBeInTheDocument()
      })
    })

    it('should call onTestsComplete callback after generation', async () => {
      const mockTests: CharacterIdentityTest[] = [mockTest]
      const onTestsComplete = vi.fn()

      vi.mocked(characterIdentityService.generateAllTests).mockResolvedValue(mockTests)

      render(
        <CharacterIdentityTestPanel
          character={mockCharacterWithIdentity}
          onTestsComplete={onTestsComplete}
        />
      )

      const generateButton = screen.getByRole('button', { name: /Generate All Tests/ })
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(onTestsComplete).toHaveBeenCalledWith(mockTests)
      })
    })

    it('should display error message on generation failure', async () => {
      vi.mocked(characterIdentityService.generateAllTests).mockRejectedValue(
        new Error('API rate limit exceeded')
      )

      render(<CharacterIdentityTestPanel character={mockCharacterWithIdentity} />)

      const generateButton = screen.getByRole('button', { name: /Generate All Tests/ })
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('API rate limit exceeded')).toBeInTheDocument()
      })
    })
  })

  describe('Generate Individual Tests', () => {
    it('should call testCharacterIdentity when individual test button is clicked', async () => {
      vi.mocked(characterIdentityService.testCharacterIdentity).mockResolvedValue(mockTest)

      render(<CharacterIdentityTestPanel character={mockCharacterWithIdentity} />)

      const portraitButton = screen.getByRole('button', { name: /Portrait/ })
      fireEvent.click(portraitButton)

      await waitFor(() => {
        expect(characterIdentityService.testCharacterIdentity).toHaveBeenCalledWith({
          characterId: mockCharacterWithIdentity.id,
          identity: mockIdentity,
          testType: 'portrait',
          onProgress: expect.any(Function),
        })
      })
    })

    it('should display similarity score for completed tests', async () => {
      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests: [mockTest],
        },
      }

      render(<CharacterIdentityTestPanel character={character} />)

      expect(screen.getByText('88.5% - Excellent')).toBeInTheDocument()
    })

    it('should replace existing test of same type when regenerating', async () => {
      const initialTest: CharacterIdentityTest = {
        ...mockTest,
        similarityScore: 75.0,
      }

      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests: [initialTest],
        },
      }

      const newTest: CharacterIdentityTest = {
        ...mockTest,
        id: 'test-new',
        similarityScore: 90.0,
      }

      const onTestsComplete = vi.fn()

      vi.mocked(characterIdentityService.testCharacterIdentity).mockResolvedValue(newTest)

      render(<CharacterIdentityTestPanel character={character} onTestsComplete={onTestsComplete} />)

      const portraitButton = screen.getByRole('button', { name: /Portrait/ })
      fireEvent.click(portraitButton)

      await waitFor(() => {
        const calls = onTestsComplete.mock.calls
        const lastCall = calls[calls.length - 1][0]
        expect(lastCall).toHaveLength(1)
        expect(lastCall[0].id).toBe('test-new')
        expect(lastCall[0].similarityScore).toBe(90.0)
      })
    })
  })

  describe('Test Results Display', () => {
    it('should show average similarity score when tests exist', () => {
      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests: [
            { ...mockTest, id: 'test-1', similarityScore: 80.0 },
            { ...mockTest, id: 'test-2', similarityScore: 90.0 },
          ],
        },
      }

      render(<CharacterIdentityTestPanel character={character} />)

      expect(screen.getByText('Average Similarity Score')).toBeInTheDocument()
      expect(screen.getByText('85.0%')).toBeInTheDocument()
      expect(screen.getByText('Excellent')).toBeInTheDocument()
    })

    it('should display all tests in gallery', () => {
      const tests: CharacterIdentityTest[] = [
        { ...mockTest, id: 'test-1', testType: 'portrait' },
        { ...mockTest, id: 'test-2', testType: 'fullbody' },
        { ...mockTest, id: 'test-3', testType: 'profile' },
      ]

      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests,
        },
      }

      const { container } = render(<CharacterIdentityTestPanel character={character} />)

      expect(screen.getByText('Test Results Gallery')).toBeInTheDocument()
      const images = container.querySelectorAll('img[alt*="test"]')
      expect(images).toHaveLength(3)
    })

    it('should show detailed comparison when test is clicked', async () => {
      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests: [mockTest],
        },
      }

      const { container } = render(<CharacterIdentityTestPanel character={character} />)

      // Find the test result card by finding the container div with cursor-pointer
      const testImage = container.querySelector('img[alt="Portrait test"]')
      expect(testImage).toBeTruthy()
      const testCard = testImage?.closest('[class*="cursor-pointer"]')
      expect(testCard).toBeTruthy()

      if (testCard) {
        fireEvent.click(testCard)
      }

      await waitFor(() => {
        expect(screen.getByText(/Detailed Comparison - Portrait/)).toBeInTheDocument()
        expect(screen.getByText('Generated Test Image')).toBeInTheDocument()
        expect(screen.getByText('Reference Images')).toBeInTheDocument()
      })
    })
  })

  describe('Approval Workflow', () => {
    it('should not show approval controls until all 5 tests are generated', () => {
      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests: [
            { ...mockTest, id: 'test-1', testType: 'portrait' },
            { ...mockTest, id: 'test-2', testType: 'fullbody' },
          ],
        },
      }

      render(<CharacterIdentityTestPanel character={character} />)

      expect(screen.queryByText('Approval Workflow')).not.toBeInTheDocument()
    })

    it('should show approval controls when all 5 tests are generated', () => {
      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests: [
            { ...mockTest, id: 'test-1', testType: 'portrait' },
            { ...mockTest, id: 'test-2', testType: 'fullbody' },
            { ...mockTest, id: 'test-3', testType: 'profile' },
            { ...mockTest, id: 'test-4', testType: 'lighting' },
            { ...mockTest, id: 'test-5', testType: 'expression' },
          ],
        },
      }

      render(<CharacterIdentityTestPanel character={character} />)

      expect(screen.getByText('Approval Workflow')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Approve for Production/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Reject & Reconfigure/ })).toBeInTheDocument()
    })

    it('should call approveCharacterIdentity when approve button is clicked', async () => {
      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests: [
            { ...mockTest, id: 'test-1', testType: 'portrait', similarityScore: 90.0 },
            { ...mockTest, id: 'test-2', testType: 'fullbody', similarityScore: 88.0 },
            { ...mockTest, id: 'test-3', testType: 'profile', similarityScore: 87.0 },
            { ...mockTest, id: 'test-4', testType: 'lighting', similarityScore: 89.0 },
            { ...mockTest, id: 'test-5', testType: 'expression', similarityScore: 91.0 },
          ],
        },
      }

      const onApprovalChange = vi.fn()

      vi.mocked(characterIdentityService.approveCharacterIdentity).mockResolvedValue({
        ...character.identity!,
        approvalStatus: 'approved',
      })

      render(
        <CharacterIdentityTestPanel character={character} onApprovalChange={onApprovalChange} />
      )

      const approveButton = screen.getByRole('button', { name: /Approve for Production/ })
      fireEvent.click(approveButton)

      await waitFor(() => {
        expect(characterIdentityService.approveCharacterIdentity).toHaveBeenCalledWith(
          character.id,
          character.identity
        )
      })

      await waitFor(() => {
        expect(onApprovalChange).toHaveBeenCalledWith(true)
      })
    })

    it('should call onApprovalChange with false when reject button is clicked', () => {
      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests: [
            { ...mockTest, id: 'test-1', testType: 'portrait' },
            { ...mockTest, id: 'test-2', testType: 'fullbody' },
            { ...mockTest, id: 'test-3', testType: 'profile' },
            { ...mockTest, id: 'test-4', testType: 'lighting' },
            { ...mockTest, id: 'test-5', testType: 'expression' },
          ],
        },
      }

      const onApprovalChange = vi.fn()

      render(
        <CharacterIdentityTestPanel character={character} onApprovalChange={onApprovalChange} />
      )

      const rejectButton = screen.getByRole('button', { name: /Reject & Reconfigure/ })
      fireEvent.click(rejectButton)

      expect(onApprovalChange).toHaveBeenCalledWith(false)
    })

    it('should disable approve button when average score is below 50%', () => {
      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests: [
            { ...mockTest, id: 'test-1', testType: 'portrait', similarityScore: 40.0 },
            { ...mockTest, id: 'test-2', testType: 'fullbody', similarityScore: 45.0 },
            { ...mockTest, id: 'test-3', testType: 'profile', similarityScore: 42.0 },
            { ...mockTest, id: 'test-4', testType: 'lighting', similarityScore: 43.0 },
            { ...mockTest, id: 'test-5', testType: 'expression', similarityScore: 44.0 },
          ],
        },
      }

      render(<CharacterIdentityTestPanel character={character} />)

      const approveButton = screen.getByRole('button', { name: /Approve for Production/ })
      expect(approveButton).toBeDisabled()
    })

    it('should show warning when average score is below 85%', () => {
      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests: [
            { ...mockTest, id: 'test-1', testType: 'portrait', similarityScore: 75.0 },
            { ...mockTest, id: 'test-2', testType: 'fullbody', similarityScore: 78.0 },
            { ...mockTest, id: 'test-3', testType: 'profile', similarityScore: 76.0 },
            { ...mockTest, id: 'test-4', testType: 'lighting', similarityScore: 77.0 },
            { ...mockTest, id: 'test-5', testType: 'expression', similarityScore: 79.0 },
          ],
        },
      }

      render(<CharacterIdentityTestPanel character={character} />)

      expect(screen.getByText('Below Target Similarity')).toBeInTheDocument()
      expect(screen.getByText(/Average score is below 85%/)).toBeInTheDocument()
    })
  })

  describe('Score Badge Logic', () => {
    it('should show "Excellent" for scores >= 85', () => {
      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests: [{ ...mockTest, similarityScore: 88.5 }],
        },
      }

      render(<CharacterIdentityTestPanel character={character} />)

      const excellentLabels = screen.getAllByText('Excellent')
      expect(excellentLabels.length).toBeGreaterThan(0)
    })

    it('should show "Good" for scores >= 70 and < 85', () => {
      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests: [{ ...mockTest, similarityScore: 75.0 }],
        },
      }

      render(<CharacterIdentityTestPanel character={character} />)

      expect(screen.getByText('Good')).toBeInTheDocument()
    })

    it('should show "Fair" for scores >= 50 and < 70', () => {
      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests: [{ ...mockTest, similarityScore: 60.0 }],
        },
      }

      render(<CharacterIdentityTestPanel character={character} />)

      expect(screen.getByText('Fair')).toBeInTheDocument()
    })

    it('should show "Poor" for scores < 50', () => {
      const character: AnalyzedCharacter = {
        ...mockCharacterWithIdentity,
        identity: {
          ...mockIdentity,
          tests: [{ ...mockTest, similarityScore: 40.0 }],
        },
      }

      render(<CharacterIdentityTestPanel character={character} />)

      expect(screen.getByText('Poor')).toBeInTheDocument()
    })
  })
})
