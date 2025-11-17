import React, { useState } from 'react';
import Button from './Button';
import { AlkemyLoadingIcon, CheckCircleIcon, XIcon, AlertCircleIcon, ImagePlusIcon } from './icons/Icons';
import type { CharacterIdentity, CharacterIdentityTest, CharacterIdentityTestType, AnalyzedCharacter } from '../types';
import {
  testCharacterIdentity,
  generateAllTests,
  approveCharacterIdentity
} from '../services/characterIdentityService';
import { useTheme } from '../theme/ThemeContext';

interface CharacterIdentityTestPanelProps {
  character: AnalyzedCharacter;
  onTestsComplete?: (tests: CharacterIdentityTest[]) => void;
  onApprovalChange?: (approved: boolean) => void;
}

const TEST_TYPE_CONFIG: Record<CharacterIdentityTestType, {
  label: string;
  description: string;
}> = {
  portrait: {
    label: 'Portrait',
    description: 'Professional headshot, neutral expression'
  },
  fullbody: {
    label: 'Full Body',
    description: 'Standing neutral pose, even lighting'
  },
  profile: {
    label: 'Profile',
    description: 'Side profile shot, studio lighting'
  },
  lighting: {
    label: 'Lighting',
    description: 'Cinematic lighting, dramatic shadows'
  },
  expression: {
    label: 'Expression',
    description: 'Natural smile, candid expression'
  }
};

export function CharacterIdentityTestPanel({
  character,
  onTestsComplete,
  onApprovalChange
}: CharacterIdentityTestPanelProps) {
  const { isDark } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [tests, setTests] = useState<CharacterIdentityTest[]>(character.identity?.tests || []);
  const [selectedTest, setSelectedTest] = useState<CharacterIdentityTest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const identity = character.identity;

  if (!identity || identity.status !== 'ready') {
    return (
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Character Identity Testing
        </h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Character identity must be trained before testing can begin.
        </p>
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircleIcon className="w-4 h-4" />
          <span className="text-sm">Identity not ready for testing</span>
        </div>
      </div>
    );
  }

  const handleGenerateAllTests = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const generatedTests = await generateAllTests({
        characterId: character.id,
        identity,
        onProgress: (overallProgress, currentTestName) => {
          setProgress(overallProgress);
          setCurrentTest(currentTestName);
        }
      });

      setTests(generatedTests);
      onTestsComplete?.(generatedTests);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Test generation failed';
      setError(errorMessage);
      console.error('Test generation error:', err);
    } finally {
      setIsGenerating(false);
      setCurrentTest('');
    }
  };

  const handleGenerateSingleTest = async (testType: CharacterIdentityTestType) => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const test = await testCharacterIdentity({
        characterId: character.id,
        identity,
        testType,
        onProgress: (prog, status) => {
          setProgress(prog);
          setCurrentTest(status);
        }
      });

      const updatedTests = [...tests.filter(t => t.testType !== testType), test];
      setTests(updatedTests);
      onTestsComplete?.(updatedTests);
      setSelectedTest(test);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Test generation failed';
      setError(errorMessage);
      console.error('Single test generation error:', err);
    } finally {
      setIsGenerating(false);
      setCurrentTest('');
    }
  };

  const handleApprove = async () => {
    try {
      await approveCharacterIdentity(character.id, identity);
      onApprovalChange?.(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Approval failed';
      setError(errorMessage);
      console.error('Approval error:', err);
    }
  };

  const handleReject = () => {
    onApprovalChange?.(false);
  };

  const getScoreBadgeClass = (score: number): string => {
    if (score >= 85) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 70) return 'bg-lime-500/20 text-lime-400 border-lime-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const averageScore = tests.length > 0
    ? tests.reduce((sum, test) => sum + test.similarityScore, 0) / tests.length
    : 0;

  const allTestsGenerated = tests.length === 5;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-xl font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <ImagePlusIcon className="w-6 h-6 text-purple-500" />
          Character Identity Testing - {character.name}
        </h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Generate test variations to validate character consistency across different scenarios.
          Target: {'>'}85% similarity for production readiness.
        </p>

        {/* Overall Score */}
        {tests.length > 0 && (
          <div className={`flex items-center justify-between p-4 rounded-lg mb-4 ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Average Similarity Score
              </p>
              <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreBadgeClass(averageScore)}`}>
              {getScoreLabel(averageScore)}
            </div>
          </div>
        )}

        {/* Generate All Tests Button */}
        <Button
          onClick={handleGenerateAllTests}
          disabled={isGenerating}
          variant="primary"
          className="w-full !py-3"
        >
          {isGenerating ? (
            <>
              <AlkemyLoadingIcon className="w-4 h-4 animate-spin" />
              <span>Generating Tests...</span>
            </>
          ) : (
            <>
              <ImagePlusIcon className="w-4 h-4" />
              <span>Generate All Tests (5 variations)</span>
            </>
          )}
        </Button>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">{currentTest}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg ${
            isDark ? 'bg-red-950 text-red-400' : 'bg-red-50 text-red-600'
          }`}>
            <XIcon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Individual Test Controls */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Individual Test Variations
        </h4>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Generate specific test types individually for targeted validation
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(TEST_TYPE_CONFIG) as CharacterIdentityTestType[]).map((testType) => {
            const config = TEST_TYPE_CONFIG[testType];
            const existingTest = tests.find(t => t.testType === testType);

            return (
              <button
                key={testType}
                onClick={() => handleGenerateSingleTest(testType)}
                disabled={isGenerating}
                className={`p-4 rounded-xl border text-left transition-all ${
                  existingTest
                    ? isDark
                      ? 'bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20'
                      : 'bg-teal-50 border-teal-200 hover:bg-teal-100'
                    : isDark
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {config.label}
                  </span>
                  {existingTest && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                </div>
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {config.description}
                </p>
                {existingTest && (
                  <div className={`text-xs px-2 py-1 rounded border inline-block ${getScoreBadgeClass(existingTest.similarityScore)}`}>
                    {existingTest.similarityScore.toFixed(1)}% - {getScoreLabel(existingTest.similarityScore)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Test Results Gallery */}
      {tests.length > 0 && (
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Test Results Gallery
          </h4>
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Click on any test result to view detailed comparison with reference images
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {tests.map((test) => (
              <div
                key={test.id}
                onClick={() => setSelectedTest(test)}
                className={`cursor-pointer rounded-lg border-2 transition-all ${
                  selectedTest?.id === test.id
                    ? 'border-purple-500 shadow-lg scale-105'
                    : isDark
                      ? 'border-gray-800 hover:border-purple-300'
                      : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className={`aspect-square overflow-hidden rounded-t-lg ${
                  isDark ? 'bg-gray-900' : 'bg-gray-100'
                }`}>
                  <img
                    src={test.generatedImageUrl}
                    alt={`${TEST_TYPE_CONFIG[test.testType].label} test`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2 space-y-1">
                  <p className="text-xs font-semibold">{TEST_TYPE_CONFIG[test.testType].label}</p>
                  <div className={`text-xs px-2 py-0.5 rounded text-center border ${getScoreBadgeClass(test.similarityScore)}`}>
                    {test.similarityScore.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Comparison View */}
      {selectedTest && (
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Detailed Comparison - {TEST_TYPE_CONFIG[selectedTest.testType].label}
          </h4>
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Compare generated test image with reference images
          </p>

          {/* Similarity Score */}
          <div className={`flex items-center justify-between p-4 rounded-lg mb-4 ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Similarity Score
              </p>
              <p className="text-xl font-bold">{selectedTest.similarityScore.toFixed(1)}%</p>
            </div>
            <div className={`px-3 py-1 rounded border ${getScoreBadgeClass(selectedTest.similarityScore)}`}>
              {getScoreLabel(selectedTest.similarityScore)}
            </div>
          </div>

          {/* Image Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Generated Image */}
            <div>
              <p className="text-sm font-semibold mb-2">Generated Test Image</p>
              <div className={`aspect-square overflow-hidden rounded-lg border-2 ${
                isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'
              }`}>
                <img
                  src={selectedTest.generatedImageUrl}
                  alt="Generated test"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Reference Images */}
            <div>
              <p className="text-sm font-semibold mb-2">Reference Images</p>
              <div className="grid grid-cols-2 gap-2">
                {identity.referenceImages.slice(0, 4).map((refImg, idx) => (
                  <div
                    key={idx}
                    className={`aspect-square overflow-hidden rounded-lg border ${
                      isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'
                    }`}
                  >
                    <img
                      src={refImg}
                      alt={`Reference ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test Metadata */}
          <div className={`p-3 rounded-lg text-xs space-y-1 ${
            isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'
          }`}>
            <p><strong>Test Type:</strong> {TEST_TYPE_CONFIG[selectedTest.testType].label}</p>
            <p><strong>Description:</strong> {TEST_TYPE_CONFIG[selectedTest.testType].description}</p>
            <p><strong>Generated:</strong> {new Date(selectedTest.timestamp).toLocaleString()}</p>
            <p><strong>Test ID:</strong> {selectedTest.id}</p>
          </div>
        </div>
      )}

      {/* Approval Controls */}
      {allTestsGenerated && (
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Approval Workflow
          </h4>
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Approve this character identity for production use or reject to reconfigure
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleApprove}
              variant="primary"
              className="flex-1 !py-3"
              disabled={averageScore < 50}
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>Approve for Production</span>
            </Button>
            <Button
              onClick={handleReject}
              variant="secondary"
              className="flex-1 !py-3 !bg-red-500 !text-white hover:!bg-red-600"
            >
              <XIcon className="w-4 h-4" />
              <span>Reject & Reconfigure</span>
            </Button>
          </div>

          {averageScore < 85 && (
            <div className={`mt-3 flex items-start gap-2 p-3 rounded-lg text-sm ${
              isDark ? 'bg-amber-950 text-amber-400' : 'bg-amber-50 text-amber-600'
            }`}>
              <AlertCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Below Target Similarity</p>
                <p className="text-xs mt-1">
                  Average score is below 85%. Consider uploading different reference images or adjusting training parameters for better results.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
