import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import React from 'react';
import { render, Box, Text } from 'ink';
import { minimatch } from 'minimatch';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

/**
 * Configuration for media file copying
 */
const CONFIG = {
  /**
   * Allowed media file patterns (glob-style matching)
   * Examples: '*.png', '*.{jpg,jpeg}', 'icon-*.svg'
   */
  allowedPatterns: [
    '*.png',
    '*.{jpg,jpeg}',
    '*.gif',
    '*.svg',
  ]
} as const;

interface CopyOptions {
  readonly recursive: boolean;
}

interface RmOptions {
  readonly recursive: boolean;
  readonly force: boolean;
}

interface FileConflictError extends Error {
  existingSource: string;
  newSource: string;
  targetPath: string;
}

/**
 * Tracks file paths that have been copied to detect conflicts.
 */
class MediaFileTracker {
  private readonly fileMap: Map<string, string> = new Map();
  private readonly copiedFiles: Array<{ from: string; to: string }> = [];
  private readonly onProgress?: (count: number) => void;

  constructor(onProgress?: (count: number) => void) {
    this.onProgress = onProgress;
  }

  /**
   * Records a file being copied and checks for conflicts.
   * @param relativePath - The relative path in the destination (e.g., "index/image.png")
   * @param sourcePath - The full source path of the file
   * @throws {Error} If a file with the same relative path was already copied from a different source
   */
  recordFile(relativePath: string, sourcePath: string): void {
    const existingSource = this.fileMap.get(relativePath);

    if (existingSource && existingSource !== sourcePath) {
      const error = new Error(
        `🚨 File name conflict detected when flattening media directories.\n` +
        `  📁 Target path: "${relativePath}"\n` +
        `  📄 Existing source: "${existingSource}"\n` +
        `  ⚠️  Conflicting source: "${sourcePath}"\n\n` +
        `Both files would be copied to the same destination. ` +
        `Please rename one of the files or restructure your media directories to avoid conflicts.`
      ) as FileConflictError;

      (error as FileConflictError).existingSource = existingSource;
      (error as FileConflictError).newSource = sourcePath;
      (error as FileConflictError).targetPath = relativePath;

      throw error;
    }

    this.fileMap.set(relativePath, sourcePath);
    this.copiedFiles.push({ from: sourcePath, to: relativePath });
    
    // Notify progress callback
    if (this.onProgress) {
      this.onProgress(this.copiedFiles.length);
    }
  }

  /**
   * Get all copied files with source and destination paths.
   */
  getCopiedFiles(): Array<{ from: string; to: string }> {
    return this.copiedFiles;
  }
}

/**
 * Recursively copies a file or directory from source to destination.
 * @param src - The source path to copy from
 * @param dest - The destination path to copy to
 * @throws {Error} If the source path doesn't exist
 */
function copyRecursiveSync(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    throw new Error(`❌ Source path does not exist: ${src}`);
  }

  const stats: fs.Stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true } as CopyOptions);
    }

    const items: string[] = fs.readdirSync(src);
    items.forEach((childItemName: string): void => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

/**
 * Cleans a directory by removing it if it exists.
 * @param dirPath - The directory path to clean
 */
function cleanDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true } as RmOptions);
  }
}

/**
 * Recursively copies the contents of a directory to a destination, flattening the structure.
 * @param src - The source directory to copy from
 * @param dest - The destination directory to copy to
 * @param destRoot - The root destination directory for calculating relative paths
 * @param tracker - File tracker to detect conflicts
 */
function copyDirectoryContents(
  src: string,
  dest: string,
  destRoot: string,
  tracker: MediaFileTracker
): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true } as CopyOptions);
  }

  const items: string[] = fs.readdirSync(src);

  for (const item of items) {
    const srcPath: string = path.join(src, item);
    const destPath: string = path.join(dest, item);
    const stats: fs.Stats = fs.statSync(srcPath);

    if (stats.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectoryContentsRecursive(srcPath, destPath, destRoot, tracker);
    } else {
      // Only copy files matching allowed patterns
      const matchesPattern = CONFIG.allowedPatterns.some(pattern =>
        minimatch(item, pattern, { nocase: true })
      );
      
      if (matchesPattern) {
        // Track and copy files
        const relativePath: string = path.relative(destRoot, destPath);
        tracker.recordFile(relativePath, srcPath);
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

/**
 * Helper function for recursive directory copying with conflict tracking.
 */
function copyDirectoryContentsRecursive(
  src: string,
  dest: string,
  destRoot: string,
  tracker: MediaFileTracker
): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true } as CopyOptions);
  }

  const items: string[] = fs.readdirSync(src);

  for (const item of items) {
    const srcPath: string = path.join(src, item);
    const destPath: string = path.join(dest, item);
    const stats: fs.Stats = fs.statSync(srcPath);

    if (stats.isDirectory()) {
      copyDirectoryContentsRecursive(srcPath, destPath, destRoot, tracker);
    } else {
      // Only copy files matching allowed patterns
      const matchesPattern = CONFIG.allowedPatterns.some(pattern =>
        minimatch(item, pattern, { nocase: true })
      );
      
      if (matchesPattern) {
        const relativePath: string = path.relative(destRoot, destPath);
        tracker.recordFile(relativePath, srcPath);
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

/**
 * Recursively finds and copies all 'media' directories from source to destination.
 * Media directories are flattened - only their contents are copied to public/media/.
 * @param dir - The directory to search in
 * @param articlesDir - The root articles directory for calculating relative paths
 * @param publicMediaDir - The public media directory to copy files to
 * @param tracker - File tracker to detect conflicts
 */
function findAndCopyMediaDirs(
  dir: string,
  articlesDir: string,
  publicMediaDir: string,
  tracker: MediaFileTracker
): void {
  const items: string[] = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath: string = path.join(dir, item);
    const stats: fs.Stats = fs.statSync(fullPath);

    if (!stats.isDirectory()) {
      continue;
    }

    if (item === 'media') {
      // Flatten: copy contents of media directory directly to public/media/
      copyDirectoryContents(fullPath, publicMediaDir, publicMediaDir, tracker);
    } else {
      // Recurse into subdirectories
      findAndCopyMediaDirs(fullPath, articlesDir, publicMediaDir, tracker);
    }
  }
}

/**
 * Main execution function to copy all media files from articles to public directory.
 */
async function copyMediaFiles(onProgress?: (count: number) => void): Promise<{
  success: boolean;
  copiedFiles?: Array<{ from: string; to: string }>;
  articlesDir?: string;
  message?: string;
}> {
  try {
    const articlesDir: string = path.join(__dirname, '..', 'articles');
    const publicMediaDir: string = path.join(__dirname, '..', 'public', 'media');
    const tracker: MediaFileTracker = new MediaFileTracker(onProgress);

    // Clean the public/media directory first
    cleanDirectory(publicMediaDir);

    // Find and copy all media directories
    findAndCopyMediaDirs(articlesDir, articlesDir, publicMediaDir, tracker);

    return { success: true, copiedFiles: tracker.getCopiedFiles(), articlesDir };
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
  const [copiedFiles, setCopiedFiles] = React.useState<Array<{ from: string; to: string }>>([]);
  const [articlesDir, setArticlesDir] = React.useState<string>('');
  const [fileCount, setFileCount] = React.useState<number>(0);

  React.useEffect(() => {
    const run = async () => {
      const result = await copyMediaFiles((count) => {
        setFileCount(count);
      });
      
      if (result.success) {
        setStatus('success');
        setCopiedFiles(result.copiedFiles || []);
        setArticlesDir(result.articlesDir || '');
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

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">🖼️  Copying Article Media Files</Text>
      </Box>

      {status === 'running' && (
        <Box>
          <Text color="cyan">{fileCount} file{fileCount !== 1 ? 's' : ''} copied...</Text>
        </Box>
      )}

      {status === 'success' && (
        <Box flexDirection="column">
          {copiedFiles.length > 0 && (
            <Box flexDirection="column" marginBottom={1}>
              <Text dimColor>Copied {copiedFiles.length} file{copiedFiles.length !== 1 ? 's' : ''}:</Text>
              <Box marginTop={1} marginBottom={1}>
                <Box width="50%">
                  <Text bold color="cyan">Source</Text>
                </Box>
                <Box width="50%">
                  <Text bold color="magenta">Destination</Text>
                </Box>
              </Box>
              {copiedFiles.map((file, index) => {
                const relativeFrom = path.relative(articlesDir, file.from).split(path.sep).join('/');
                const relativeTo = '/media/' + file.to.split(path.sep).join('/');
                
                // Calculate available width per column (terminal width / 2, minus padding)
                const terminalWidth = process.stdout.columns || 80;
                const columnWidth = Math.floor((terminalWidth - 4) / 2);
                
                return (
                  <Box key={index}>
                    <Box width="50%">
                      <Text dimColor>{truncate(relativeFrom, columnWidth)}</Text>
                    </Box>
                    <Box width="50%">
                      <Text color="green">{truncate(relativeTo, columnWidth)}</Text>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
          <Box>
            <Text color="green" bold>✅ Media files copied successfully!</Text>
          </Box>
        </Box>
      )}

      {status === 'error' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="red" bold>❌ Error copying media files:</Text>
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
