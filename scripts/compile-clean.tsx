#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, Box, Text } from 'ink';

/**
 * Configuration structure for content cleaning
 */
interface ContentSource {
  readonly repository: string;
  readonly branch: string;
  readonly mappings: ReadonlyArray<{
    readonly source: string;
    readonly target: string;
  }>;
}

interface ContentConfig {
  readonly sources: ReadonlyArray<ContentSource>;
  readonly include: ReadonlyArray<string>;
  readonly exclude: ReadonlyArray<string>;
}

interface RmOptions {
  readonly recursive: boolean;
  readonly force: boolean;
}

interface CleanedDirectory {
  readonly path: string;
  readonly repository: string;
}

/**
 * Cleans a directory by removing it if it exists
 */
function cleanDirectory(dirPath: string): boolean {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true } as RmOptions);
    return true;
  }
  return false;
}

/**
 * Cleans target directories based on configuration mappings
 */
async function cleanContent(
  config: ContentConfig,
  onProgress?: (cleaned: CleanedDirectory) => void
): Promise<{
  success: boolean;
  cleanedDirectories?: ReadonlyArray<CleanedDirectory>;
  message?: string;
}> {
  try {
    const cleaned: CleanedDirectory[] = [];

    // Clean compiled versioned snapshots
    if (cleanDirectory(path.join(process.cwd(), 'versioned'))) {
      const cleanedDir: CleanedDirectory = { path: 'versioned', repository: '(versioned snapshots)' };
      cleaned.push(cleanedDir);
      if (onProgress) {
        onProgress(cleanedDir);
      }
    }

    // Process each source repository
    for (const source of config.sources) {
      // Process each mapping and clean target directories
      for (const mapping of source.mappings) {
        const targetDir = path.join(process.cwd(), mapping.target);
        
        if (cleanDirectory(targetDir)) {
          const cleanedDir: CleanedDirectory = {
            path: mapping.target,
            repository: source.repository
          };
          cleaned.push(cleanedDir);
          
          if (onProgress) {
            onProgress(cleanedDir);
          }
        }
      }
    }

    return {
      success: true,
      cleanedDirectories: cleaned
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
  const [status, setStatus] = React.useState<'loading' | 'cleaning' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [cleanedDirectories, setCleanedDirectories] = React.useState<ReadonlyArray<CleanedDirectory>>([]);
  const [cleanCount, setCleanCount] = React.useState<number>(0);
  const [config, setConfig] = React.useState<ContentConfig | null>(null);

  React.useEffect(() => {
    const run = async () => {
      try {
        // Load configuration
        const configPath = path.join(process.cwd(), 'content.config.json');
        if (!fs.existsSync(configPath)) {
          throw new Error('content.config.json not found');
        }

        const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as ContentConfig;
        
        // Validate configuration
        if (!loadedConfig.sources || loadedConfig.sources.length === 0) {
          throw new Error('content.config.json must include at least one source');
        }

        setConfig(loadedConfig);
        setStatus('cleaning');

        // Clean content
        const result = await cleanContent(loadedConfig, (cleaned) => {
          setCleanCount(prev => prev + 1);
        });

        if (result.success) {
          setStatus('success');
          setCleanedDirectories(result.cleanedDirectories || []);
        } else {
          setStatus('error');
          setErrorMessage(result.message || 'Unknown error');
        }

        // Exit after a brief delay
        setTimeout(() => {
          process.exit(result.success ? 0 : 1);
        }, 100);
      } catch (error: unknown) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setTimeout(() => {
          process.exit(1);
        }, 100);
      }
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

  /**
   * Groups directories by repository
   */
  const groupByRepository = (dirs: ReadonlyArray<CleanedDirectory>): Map<string, CleanedDirectory[]> => {
    const grouped = new Map<string, CleanedDirectory[]>();
    for (const dir of dirs) {
      const existing = grouped.get(dir.repository) || [];
      existing.push(dir);
      grouped.set(dir.repository, existing);
    }
    return grouped;
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">🧹 Cleaning Content Directories</Text>
      </Box>

      {status === 'loading' && (
        <Box>
          <Text color="cyan">Loading configuration...</Text>
        </Box>
      )}

      {status === 'cleaning' && (
        <Box flexDirection="column">
          <Box>
            <Text color="cyan">{cleanCount} director{cleanCount !== 1 ? 'ies' : 'y'} cleaned...</Text>
          </Box>
        </Box>
      )}

      {status === 'success' && (
        <Box flexDirection="column">
          {cleanedDirectories.length > 0 ? (
            <>
              <Box flexDirection="column" marginBottom={1}>
                <Text bold color="green">✅ Successfully cleaned {cleanedDirectories.length} director{cleanedDirectories.length === 1 ? 'y' : 'ies'}!</Text>
              </Box>

              <Box flexDirection="column" marginTop={1}>
                {Array.from(groupByRepository(cleanedDirectories)).map(([repo, dirs], idx) => (
                  <Box key={idx} flexDirection="column" marginBottom={1}>
                    <Box>
                      <Text bold color="magenta">{truncate(repo, 70)}</Text>
                      <Text dimColor> ({dirs.length} director{dirs.length === 1 ? 'y' : 'ies'})</Text>
                    </Box>
                    <Box marginLeft={2} flexDirection="column">
                      {dirs.map((dir, dirIdx) => (
                        <Box key={dirIdx}>
                          <Text dimColor>→ {dir.path}</Text>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            <Box>
              <Text dimColor>No directories needed cleaning (all targets already clean)</Text>
            </Box>
          )}
        </Box>
      )}

      {status === 'error' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="red" bold>❌ Error cleaning content:</Text>
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
