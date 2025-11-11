import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Sparkles, Image as ImageIcon } from 'lucide-react';
import type { CharacterIdentity, CharacterIdentityTest, CharacterIdentityTestType, AnalyzedCharacter } from '@/types';
import {
  testCharacterIdentity,
  generateAllTests,
  approveCharacterIdentity,
  calculateSimilarity
} from '@/services/characterIdentityService';
import { cn } from '@/lib/utils';

interface CharacterIdentityTestPanelProps {
  character: AnalyzedCharacter;
  onTestsComplete?: (tests: CharacterIdentityTest[]) => void;
  onApprovalChange?: (approved: boolean) => void;
}

const TEST_TYPE_CONFIG: Record<CharacterIdentityTestType, {
  label: string;
  description: string;
  icon: React.ReactNode;
}> = {
  portrait: {
    label: 'Portrait',
    description: 'Professional headshot, neutral expression',
    icon: <ImageIcon className="w-4 h-4" />
  },
  fullbody: {
    label: 'Full Body',
    description: 'Standing neutral pose, even lighting',
    icon: <ImageIcon className="w-4 h-4" />
  },
  profile: {
    label: 'Profile',
    description: 'Side profile shot, studio lighting',
    icon: <ImageIcon className="w-4 h-4" />
  },
  lighting: {
    label: 'Lighting',
    description: 'Cinematic lighting, dramatic shadows',
    icon: <ImageIcon className="w-4 h-4" />
  },
  expression: {
    label: 'Expression',
    description: 'Natural smile, candid expression',
    icon: <ImageIcon className="w-4 h-4" />
  }
};

export function CharacterIdentityTestPanel({
  character,
  onTestsComplete,
  onApprovalChange
}: CharacterIdentityTestPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [tests, setTests] = useState<CharacterIdentityTest[]>(character.identity?.tests || []);
  const [selectedTest, setSelectedTest] = useState<CharacterIdentityTest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const identity = character.identity;

  if (!identity || identity.status !== 'ready') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Character Identity Testing</CardTitle>
          <CardDescription>
            Character identity must be trained before testing can begin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Identity not ready for testing</span>
          </div>
        </CardContent>
      </Card>
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

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 85) return 'default'; // Green (success)
    if (score >= 70) return 'secondary'; // Yellow (warning)
    return 'destructive'; // Red (error)
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
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Character Identity Testing - {character.name}
          </CardTitle>
          <CardDescription>
            Generate test variations to validate character consistency across different scenarios.
            Target: {'>'} 85% similarity for production readiness.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Score */}
          {tests.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Average Similarity Score</p>
                <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
              </div>
              <Badge variant={getScoreBadgeVariant(averageScore)} className="text-lg px-3 py-1">
                {getScoreLabel(averageScore)}
              </Badge>
            </div>
          )}

          {/* Generate All Tests Button */}
          <Button
            onClick={handleGenerateAllTests}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Tests...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate All Tests (5 variations)
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-slate-500 text-center">{currentTest}</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-red-600 dark:text-red-400">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Individual Test Variations</CardTitle>
          <CardDescription>
            Generate specific test types individually for targeted validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Object.keys(TEST_TYPE_CONFIG) as CharacterIdentityTestType[]).map((testType) => {
              const config = TEST_TYPE_CONFIG[testType];
              const existingTest = tests.find(t => t.testType === testType);

              return (
                <Button
                  key={testType}
                  variant={existingTest ? 'outline' : 'secondary'}
                  className="h-auto flex-col items-start p-4 space-y-2"
                  onClick={() => handleGenerateSingleTest(testType)}
                  disabled={isGenerating}
                >
                  <div className="flex items-center gap-2 w-full">
                    {config.icon}
                    <span className="font-semibold">{config.label}</span>
                    {existingTest && (
                      <CheckCircle2 className="w-4 h-4 ml-auto text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-left text-slate-500 dark:text-slate-400 font-normal">
                    {config.description}
                  </p>
                  {existingTest && (
                    <Badge variant={getScoreBadgeVariant(existingTest.similarityScore)} className="text-xs">
                      {existingTest.similarityScore.toFixed(1)}% - {getScoreLabel(existingTest.similarityScore)}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Test Results Gallery */}
      {tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Results Gallery</CardTitle>
            <CardDescription>
              Click on any test result to view detailed comparison with reference images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  onClick={() => setSelectedTest(test)}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 transition-all",
                    selectedTest?.id === test.id
                      ? "border-purple-500 shadow-lg scale-105"
                      : "border-slate-200 dark:border-slate-800 hover:border-purple-300"
                  )}
                >
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-slate-100 dark:bg-slate-900">
                    <img
                      src={test.generatedImageUrl}
                      alt={`${TEST_TYPE_CONFIG[test.testType].label} test`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 space-y-1">
                    <p className="text-xs font-semibold">{TEST_TYPE_CONFIG[test.testType].label}</p>
                    <Badge
                      variant={getScoreBadgeVariant(test.similarityScore)}
                      className="text-xs w-full justify-center"
                    >
                      {test.similarityScore.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Comparison View */}
      {selectedTest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Detailed Comparison - {TEST_TYPE_CONFIG[selectedTest.testType].label}
            </CardTitle>
            <CardDescription>
              Compare generated test image with reference images
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Similarity Score */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Similarity Score</p>
                <p className="text-xl font-bold">{selectedTest.similarityScore.toFixed(1)}%</p>
              </div>
              <Badge variant={getScoreBadgeVariant(selectedTest.similarityScore)} className="text-base px-3 py-1">
                {getScoreLabel(selectedTest.similarityScore)}
              </Badge>
            </div>

            {/* Image Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Generated Image */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">Generated Test Image</p>
                <div className="aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800">
                  <img
                    src={selectedTest.generatedImageUrl}
                    alt="Generated test"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Reference Images */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">Reference Images</p>
                <div className="grid grid-cols-2 gap-2">
                  {identity.referenceImages.slice(0, 4).map((refImg, idx) => (
                    <div
                      key={idx}
                      className="aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
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
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p><strong>Test Type:</strong> {TEST_TYPE_CONFIG[selectedTest.testType].label}</p>
              <p><strong>Description:</strong> {TEST_TYPE_CONFIG[selectedTest.testType].description}</p>
              <p><strong>Generated:</strong> {new Date(selectedTest.timestamp).toLocaleString()}</p>
              <p><strong>Test ID:</strong> {selectedTest.id}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Controls */}
      {allTestsGenerated && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Approval Workflow</CardTitle>
            <CardDescription>
              Approve this character identity for production use or reject to reconfigure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                className="flex-1"
                variant="default"
                size="lg"
                disabled={averageScore < 50}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve for Production
              </Button>
              <Button
                onClick={handleReject}
                className="flex-1"
                variant="destructive"
                size="lg"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject & Reconfigure
              </Button>
            </div>

            {averageScore < 85 && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg text-amber-600 dark:text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Below Target Similarity</p>
                  <p className="text-xs mt-1">
                    Average score is below 85%. Consider uploading different reference images or adjusting training parameters for better results.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
