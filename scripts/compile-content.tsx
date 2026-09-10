import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import React from 'react';
import { render, Box, Text } from 'ink';
import { minimatch } from 'minimatch';

/**
 * Configuration structure for content cloning
 */
interface ContentSource {
  readonly repository: string;
  readonly branch: string;
  readonly mappings: ReadonlyArray<{
    readonly source: string;
    readonly target: string;
  }>;
  /**
   * Additional frozen documentation versions to compile alongside the main
   * branch. Each entry clones the repository at the given ref (tag or branch)
   * and copies the same mappings into versioned/<label>/<target>, which the
   * /docs/versions/<label>/ routes render as an archived snapshot.
   */
  readonly versions?: ReadonlyArray<{
    readonly label: string;
    readonly ref: string;
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

interface CopyOptions {
  readonly recursive: boolean;
}

interface CopiedFile {
  readonly from: string;
  readonly to: string;
  readonly repository: string;
}

/**
 * Tracks file paths that have been copied
 */
class FileTracker {
  private readonly copiedFiles: CopiedFile[] = [];
  private readonly onProgress?: (count: number, repository: string) => void;

  constructor(onProgress?: (count: number, repository: string) => void) {
    this.onProgress = onProgress;
  }

  /**
   * Records a file being copied
   */
  recordFile(relativePath: string, sourcePath: string, repository: string): void {
    this.copiedFiles.push({
      from: sourcePath,
      to: relativePath,
      repository
    });
    
    if (this.onProgress) {
      this.onProgress(this.copiedFiles.length, repository);
    }
  }

  /**
   * Get all copied files with source and destination paths
   */
  getCopiedFiles(): ReadonlyArray<CopiedFile> {
    return this.copiedFiles;
  }
}

/**
 * Cleans a directory by removing it if it exists
 */
function cleanDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true } as RmOptions);
  }
}

/**
 * Ensures a directory exists
 */
function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true } as CopyOptions);
  }
}

/**
 * Checks if a file should be included based on include patterns
 */
function shouldInclude(relativePath: string, includePatterns: ReadonlyArray<string>): boolean {
  return includePatterns.some(pattern =>
    minimatch(relativePath, pattern, { nocase: true, matchBase: true })
  );
}

/**
 * Checks if a file should be excluded based on exclude patterns
 */
function shouldExclude(relativePath: string, excludePatterns: ReadonlyArray<string>): boolean {
  return excludePatterns.some(pattern =>
    minimatch(relativePath, pattern, { nocase: true, matchBase: true })
  );
}

/**
 * Recursively copies files from source to destination with filtering
 */
function copyFilesRecursive(
  sourceBase: string,
  targetBase: string,
  includePatterns: ReadonlyArray<string>,
  excludePatterns: ReadonlyArray<string>,
  tracker: FileTracker,
  repository: string,
  currentPath: string = ''
): void {
  const fullSourcePath = path.join(sourceBase, currentPath);
  const fullTargetPath = path.join(targetBase, currentPath);

  if (!fs.existsSync(fullSourcePath)) {
    return;
  }

  const items = fs.readdirSync(fullSourcePath);

  for (const item of items) {
    const itemSourcePath = path.join(fullSourcePath, item);
    const itemTargetPath = path.join(fullTargetPath, item);
    const itemRelativePath = path.join(currentPath, item).replace(/\\/g, '/');
    const stats = fs.statSync(itemSourcePath);

    if (stats.isDirectory()) {
      copyFilesRecursive(
        sourceBase,
        targetBase,
        includePatterns,
        excludePatterns,
        tracker,
        repository,
        itemRelativePath
      );
    } else {
      // Check if file should be included and not excluded
      if (shouldInclude(itemRelativePath, includePatterns) && !shouldExclude(itemRelativePath, excludePatterns)) {
        ensureDirectory(path.dirname(itemTargetPath));
        fs.copyFileSync(itemSourcePath, itemTargetPath);
        tracker.recordFile(itemRelativePath, itemSourcePath, repository);
      }
    }
  }
}

/**
 * Clones content from repositories
 */
async function cloneContent(
  config: ContentConfig,
  onProgress?: (count: number, repository: string) => void
): Promise<{
  success: boolean;
  copiedFiles?: ReadonlyArray<CopiedFile>;
  message?: string;
}> {
  const TEMP_DIR = path.join(process.cwd(), '_tmp');
  const VERSIONED_DIR = path.join(process.cwd(), 'versioned');
  const tracker = new FileTracker(onProgress);

  try {
    // Clean temp directory
    cleanDirectory(TEMP_DIR);
    ensureDirectory(TEMP_DIR);

    // Clean versioned snapshots from a previous compile
    cleanDirectory(VERSIONED_DIR);

    // Process each source repository
    for (const source of config.sources) {
      const repoName = source.repository.split('/').pop() || 'repo';
      const cloneDir = path.join(TEMP_DIR, repoName);

      // Clone the repository. A failed clone must fail the build: the copy
      // loop below finds nothing to copy and the site would otherwise deploy
      // with empty documentation and reference sections.
      const cloneResult = spawnSync(
        'git',
        ['clone', '--depth', '1', '--branch', source.branch, source.repository, cloneDir],
        { stdio: 'pipe' }
      );

      if (cloneResult.error) {
        throw new Error(
          `git clone failed for ${source.repository}: ${cloneResult.error.message}`
        );
      }

      if (cloneResult.status !== 0) {
        const stderr = cloneResult.stderr?.toString().trim();
        throw new Error(
          `git clone failed for ${source.repository} (branch ${source.branch}): ${stderr || `exit code ${cloneResult.status}`}`
        );
      }

      // Process each mapping
      for (const mapping of source.mappings) {
        const sourceDir = path.join(cloneDir, mapping.source);
        const targetDir = path.join(process.cwd(), mapping.target);

        if (!fs.existsSync(sourceDir)) {
          throw new Error(
            `Source folder "${mapping.source}" does not exist in ${source.repository}; the repository layout may have changed.`
          );
        }

        // Clean target directory
        cleanDirectory(targetDir);
        ensureDirectory(targetDir);

        const copiedBefore = tracker.getCopiedFiles().length;

        // Copy files with filtering
        copyFilesRecursive(
          sourceDir,
          targetDir,
          config.include,
          config.exclude,
          tracker,
          source.repository
        );

        if (tracker.getCopiedFiles().length === copiedBefore) {
          throw new Error(
            `No files matched for mapping "${mapping.source}" -> "${mapping.target}" from ${source.repository}; refusing to build with empty documentation content.`
          );
        }
      }

      // Compile frozen documentation versions (tags/branches) into versioned/<label>/
      for (const version of source.versions ?? []) {
        const versionCloneDir = path.join(TEMP_DIR, `${repoName}-${version.label}`);

        const versionCloneResult = spawnSync(
          'git',
          ['clone', '--depth', '1', '--branch', version.ref, source.repository, versionCloneDir],
          { stdio: 'pipe' }
        );

        if (versionCloneResult.error || versionCloneResult.status !== 0) {
          const stderr = versionCloneResult.stderr?.toString().trim();
          throw new Error(
            `git clone failed for ${source.repository} at ref ${version.ref}: ${versionCloneResult.error?.message || stderr || `exit code ${versionCloneResult.status}`}`
          );
        }

        for (const mapping of source.mappings) {
          const sourceDir = path.join(versionCloneDir, mapping.source);
          const targetDir = path.join(VERSIONED_DIR, version.label, mapping.target);

          // Unlike the main branch, a missing folder in an old snapshot is
          // expected (sections are added over time), so skip instead of throwing.
          if (!fs.existsSync(sourceDir)) {
            continue;
          }

          ensureDirectory(targetDir);
          copyFilesRecursive(
            sourceDir,
            targetDir,
            config.include,
            config.exclude,
            tracker,
            `${source.repository}@${version.ref}`
          );
        }
      }
    }

    // Clean up temp directory
    cleanDirectory(TEMP_DIR);

    return {
      success: true,
      copiedFiles: tracker.getCopiedFiles()
    };
  } catch (error: unknown) {
    // Clean up on error
    cleanDirectory(TEMP_DIR);

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
  const [status, setStatus] = React.useState<'loading' | 'compiling' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [copiedFiles, setCopiedFiles] = React.useState<ReadonlyArray<CopiedFile>>([]);
  const [fileCount, setFileCount] = React.useState<number>(0);
  const [currentRepo, setCurrentRepo] = React.useState<string>('');
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
        setStatus('compiling');

        // Compile content
        const result = await cloneContent(loadedConfig, (count, repo) => {
          setFileCount(count);
          setCurrentRepo(repo);
        });

        if (result.success) {
          setStatus('success');
          setCopiedFiles(result.copiedFiles || []);
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
   * Groups files by repository
   */
  const groupByRepository = (files: ReadonlyArray<CopiedFile>): Map<string, CopiedFile[]> => {
    const grouped = new Map<string, CopiedFile[]>();
    for (const file of files) {
      const existing = grouped.get(file.repository) || [];
      existing.push(file);
      grouped.set(file.repository, existing);
    }
    return grouped;
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">📦 Compiling Documentation Content</Text>
      </Box>

      {status === 'loading' && (
        <Box>
          <Text color="cyan">Loading configuration...</Text>
        </Box>
      )}

      {status === 'compiling' && (
        <Box flexDirection="column">
          <Box>
            <Text color="cyan">{fileCount} file{fileCount !== 1 ? 's' : ''} copied...</Text>
          </Box>
          {currentRepo && (
            <Box marginTop={1}>
              <Text dimColor>From: {truncate(currentRepo, 60)}</Text>
            </Box>
          )}
        </Box>
      )}

      {status === 'success' && (
        <Box flexDirection="column">
          {config && (
            <Box flexDirection="column" marginBottom={1}>
              <Text bold color="green">✅ Successfully compiled content from {config.sources.length} repositor{config.sources.length === 1 ? 'y' : 'ies'}!</Text>
              <Text dimColor>Total files copied: {copiedFiles.length}</Text>
            </Box>
          )}

          {copiedFiles.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              {Array.from(groupByRepository(copiedFiles)).map(([repo, files], idx) => (
                <Box key={idx} flexDirection="column" marginBottom={1}>
                  <Box>
                    <Text bold color="magenta">{truncate(repo, 70)}</Text>
                    <Text dimColor> ({files.length} files)</Text>
                  </Box>
                  <Box marginLeft={2} flexDirection="column">
                    {files.slice(0, 5).map((file, fileIdx) => (
                      <Box key={fileIdx}>
                        <Text dimColor>→ {truncate(file.to, 65)}</Text>
                      </Box>
                    ))}
                    {files.length > 5 && (
                      <Box>
                        <Text dimColor>... and {files.length - 5} more files</Text>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {status === 'error' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="red" bold>❌ Error cloning content:</Text>
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
