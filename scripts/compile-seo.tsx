import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, Box, Text } from 'ink';
import { ImageResponse } from 'next/og';
import pLimit from 'p-limit';
import type { Entity } from '../app/types/Entity';

/**
 * Dynamically imports the content service to handle module resolution
 */
async function getContentEntities(): Promise<Entity[]> {
  const { getAllContent } = await import('../app/services/contentService.js');
  return getAllContent();
}

/**
 * Configuration for Open Graph image generation
 */
const CONFIG = {
  /**
   * Maximum number of concurrent image generation tasks
   */
  concurrency: 10,

  /**
   * Image dimensions (px)
   */
  dimensions: {
    width: 1200,
    height: 630,
  },
} as const;

interface MkdirOptions {
  readonly recursive: boolean;
}

/**
 * Tracks image generation progress and results.
 */
class ImageGenerationTracker {
  private readonly results: Array<{ success: boolean; path: string; sourceUrl?: string; error?: unknown }> = [];
  private readonly onProgress?: (count: number) => void;

  constructor(onProgress?: (count: number) => void) {
    this.onProgress = onProgress;
  }

  /**
   * Records the result of an image generation attempt.
   */
  recordResult(result: { success: boolean; path: string; sourceUrl?: string; error?: unknown }): void {
    this.results.push(result);

    if (this.onProgress) {
      this.onProgress(this.results.length);
    }
  }

  /**
   * Get all results with success/failure status.
   */
  getResults(): Array<{ success: boolean; path: string; sourceUrl?: string; error?: unknown }> {
    return this.results;
  }

  /**
   * Get count of successful generations.
   */
  getSuccessCount(): number {
    return this.results.filter(r => r.success).length;
  }

  /**
   * Get count of failed generations.
   */
  getErrorCount(): number {
    return this.results.filter(r => !r.success).length;
  }
}

/**
 * Generates an Open Graph image for the given parameters.
 */
async function generateOpenGraphImage(params: {
  title: string;
  description: string;
  section?: string;
}): Promise<ArrayBuffer> {
  const { title, description, section } = params;

  const response = new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #262626 50%, #0a0a0a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Background decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '80px',
            right: '100px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '100px',
            left: '100px',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
          }}
        />

        {/* Safe zone container - max 750px width */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '700px',
            height: '100%',
            padding: '80px 0',
          }}
        >
          {/* Header with branding */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#3b82f6',
                letterSpacing: '-0.5px',
              }}
            >
              DocumentDB
            </div>
          </div>

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div
              style={{
                fontSize: 54,
                fontWeight: 'bold',
                color: 'white',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#a0a0a0',
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {description}
            </div>
          </div>

          {/* Footer with section indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {section && (
              <div
                style={{
                  fontSize: 18,
                  color: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '1px',
                }}
              >
                {section}
              </div>
            )}
            <div
              style={{
                fontSize: 18,
                color: '#666',
                marginLeft: section ? '0' : 'auto',
              }}
            >
              documentdb.io
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: CONFIG.dimensions.width,
      height: CONFIG.dimensions.height,
    }
  );

  return await response.arrayBuffer();
}

/**
 * Main execution function to generate all Open Graph images.
 */
async function generateAllImages(onProgress?: (count: number) => void, onTotal?: (total: number) => void): Promise<{
  success: boolean;
  results?: Array<{ success: boolean; path: string; sourceUrl?: string; error?: unknown }>;
  duration?: number;
  message?: string;
}> {
  try {
    const startTime: number = Date.now();
    const targetDir: string = path.join(process.cwd(), 'public', 'open-graph');

    // Ensure output directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true } as MkdirOptions);
    }

    const entities = await getContentEntities();
    const tracker: ImageGenerationTracker = new ImageGenerationTracker(onProgress);

    // Notify total count
    if (onTotal) {
      onTotal(entities.length);
    }

    // p-limit automatically manages concurrency
    const limit = pLimit(CONFIG.concurrency);

    // Generate all images with automatic concurrency control
    const promises = entities.map((entity) =>
      limit(async () => {
        try {
          const buffer: ArrayBuffer = await generateOpenGraphImage({
            title: entity.title,
            description: entity.description,
            section: entity.section,
          });

          const outputPath: string = path.join(targetDir, entity.slug);
          // Convert ArrayBuffer to Uint8Array for fs.writeFile
          await fs.promises.writeFile(outputPath, new Uint8Array(buffer));

          tracker.recordResult({ success: true, path: entity.slug, sourceUrl: entity.url });
        } catch (error: unknown) {
          tracker.recordResult({ success: false, path: entity.slug, sourceUrl: entity.url, error });
        }
      })
    );

    await Promise.all(promises);

    const duration: number = Date.now() - startTime;

    return {
      success: true,
      results: tracker.getResults(),
      duration,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Main Console component for Ink rendering
 */
const Console: React.FC = () => {
  const [status, setStatus] = React.useState<'running' | 'success' | 'error'>('running');
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [results, setResults] = React.useState<Array<{ success: boolean; path: string; sourceUrl?: string; error?: unknown }>>([]);
  const [duration, setDuration] = React.useState<number>(0);
  const [imageCount, setImageCount] = React.useState<number>(0);
  const [totalCount, setTotalCount] = React.useState<number>(0);

  React.useEffect(() => {
    const run = async () => {
      const result = await generateAllImages(
        (count) => {
          setImageCount(count);
        },
        (total) => {
          setTotalCount(total);
        }
      );

      if (result.success) {
        setStatus('success');
        setResults(result.results || []);
        setDuration(result.duration || 0);
      } else {
        setStatus('error');
        setErrorMessage(result.message || 'Unknown error');
      }

      // Exit after a brief delay to show the final message
      setTimeout(() => {
        process.exit(result.success ? 0 : 1);
      }, 100);
    };

    run();
  }, []);

  /**
   * Truncates a string to a maximum length with ellipsis
   */
  const truncate = (str: string, maxLength: number): string => {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
  };

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;
  const durationSeconds = (duration / 1000).toFixed(2);

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">🎨 Generating Open Graph Images</Text>
      </Box>

      {status === 'running' && (
        <Box>
          <Text color="cyan">✓ Progress: {imageCount}/{totalCount} images generated...</Text>
        </Box>
      )}

      {status === 'success' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="green">✅ Generated {successCount} image{successCount !== 1 ? 's' : ''} successfully in {durationSeconds}s</Text>
          </Box>

          {errorCount > 0 && (
            <Box marginBottom={1}>
              <Text color="yellow">⚠️  {errorCount} image{errorCount !== 1 ? 's' : ''} failed to generate</Text>
            </Box>
          )}

          {results.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text dimColor>Generated images:</Text>
              <Box marginTop={1} marginBottom={1}>
                <Box width="35%">
                  <Text bold color="cyan">Source</Text>
                </Box>
                <Box width="45%">
                  <Text bold color="magenta">Target</Text>
                </Box>
                <Box width="20%">
                  <Text bold color="yellow">Status</Text>
                </Box>
              </Box>
              {results.slice(0, 10).map((result, index) => {
                const terminalWidth = process.stdout.columns || 80;
                const sourceColumnWidth = Math.floor((terminalWidth - 4) * 0.35);
                const targetColumnWidth = Math.floor((terminalWidth - 4) * 0.45);

                return (
                  <Box key={index}>
                    <Box width="35%">
                      <Text dimColor>{truncate(result.sourceUrl || '', sourceColumnWidth)}</Text>
                    </Box>
                    <Box width="45%">
                      <Text dimColor>{truncate(result.path, targetColumnWidth)}</Text>
                    </Box>
                    <Box width="20%">
                      {result.success ? (
                        <Text color="green">✓ Success</Text>
                      ) : (
                        <Text color="red">✗ Failed</Text>
                      )}
                    </Box>
                  </Box>
                );
              })}
              {results.length > 10 && (
                <Box marginTop={1}>
                  <Text dimColor>... and {results.length - 10} more</Text>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {status === 'error' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="red" bold>❌ Error generating images:</Text>
          </Box>
          <Box paddingLeft={2}>
            <Text color="red">{errorMessage}</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

render(<Console />);
