/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import fs, { promises as fsAsync } from 'fs';
import path from 'path';
// File reading cache to avoid repeated file system access
const fileCache = new Map();
const CACHE_TTL = 5000; // 5 seconds
import mime from 'mime-types';
// Constants for text file processing
const DEFAULT_MAX_LINES_TEXT_FILE = 2000;
const MAX_LINE_LENGTH_TEXT_FILE = 2000;
// Default values for encoding and separator format
export const DEFAULT_ENCODING = 'utf-8';
/**
 * Looks up the specific MIME type for a file path.
 * @param filePath Path to the file.
 * @returns The specific MIME type string (e.g., 'text/python', 'application/javascript') or undefined if not found or ambiguous.
 */
export function getSpecificMimeType(filePath) {
  const lookedUpMime = mime.lookup(filePath);
  return typeof lookedUpMime === 'string' ? lookedUpMime : undefined;
}
/**
 * Checks if a path is within a given root directory.
 * @param pathToCheck The absolute path to check.
 * @param rootDirectory The absolute root directory.
 * @returns True if the path is within the root directory, false otherwise.
 */
export function isWithinRoot(pathToCheck, rootDirectory) {
  const normalizedPathToCheck = path.normalize(pathToCheck);
  const normalizedRootDirectory = path.normalize(rootDirectory);
  // Ensure the rootDirectory path ends with a separator for correct startsWith comparison,
  // unless it's the root path itself (e.g., '/' or 'C:\').
  const rootWithSeparator =
    normalizedRootDirectory === path.sep ||
    normalizedRootDirectory.endsWith(path.sep)
      ? normalizedRootDirectory
      : normalizedRootDirectory + path.sep;
  return (
    normalizedPathToCheck === normalizedRootDirectory ||
    normalizedPathToCheck.startsWith(rootWithSeparator)
  );
}
/**
 * Determines if a file is likely binary based on content sampling.
 * @param filePath Path to the file.
 * @returns True if the file appears to be binary.
 */
export function isBinaryFile(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    // Read up to 4KB or file size, whichever is smaller
    const fileSize = fs.fstatSync(fd).size;
    if (fileSize === 0) {
      // Empty file is not considered binary for content checking
      fs.closeSync(fd);
      return false;
    }
    const bufferSize = Math.min(4096, fileSize);
    const buffer = Buffer.alloc(bufferSize);
    const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);
    if (bytesRead === 0) return false;
    let nonPrintableCount = 0;
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) return true; // Null byte is a strong indicator
      if (buffer[i] < 9 || (buffer[i] > 13 && buffer[i] < 32)) {
        nonPrintableCount++;
      }
    }
    // If >30% non-printable characters, consider it binary
    return nonPrintableCount / bytesRead > 0.3;
  } catch {
    // If any error occurs (e.g. file not found, permissions),
    // treat as not binary here; let higher-level functions handle existence/access errors.
    return false;
  }
}
/**
 * Detects the type of file based on extension and content.
 * @param filePath Path to the file.
 * @returns 'text', 'image', 'pdf', or 'binary'.
 */
export function detectFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const lookedUpMimeType = mime.lookup(filePath); // Returns false if not found, or the mime type string
  if (lookedUpMimeType && lookedUpMimeType.startsWith('image/')) {
    return 'image';
  }
  if (lookedUpMimeType && lookedUpMimeType === 'application/pdf') {
    return 'pdf';
  }
  // Stricter binary check for common non-text extensions before content check
  // These are often not well-covered by mime-types or might be misidentified.
  if (
    [
      '.zip',
      '.tar',
      '.gz',
      '.exe',
      '.dll',
      '.so',
      '.class',
      '.jar',
      '.war',
      '.7z',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.ppt',
      '.pptx',
      '.odt',
      '.ods',
      '.odp',
      '.bin',
      '.dat',
      '.obj',
      '.o',
      '.a',
      '.lib',
      '.wasm',
      '.pyc',
      '.pyo',
    ].includes(ext)
  ) {
    return 'binary';
  }
  // Fallback to content-based check if mime type wasn't conclusive for image/pdf
  // and it's not a known binary extension.
  if (isBinaryFile(filePath)) {
    return 'binary';
  }
  return 'text';
}
/**
 * Reads and processes a single file, handling text, images, and PDFs.
 * @param filePath Absolute path to the file.
 * @param rootDirectory Absolute path to the project root for relative path display.
 * @param offset Optional offset for text files (0-based line number).
 * @param limit Optional limit for text files (number of lines to read).
 * @returns ProcessedFileReadResult object.
 */
export async function processSingleFileContent(
  filePath,
  rootDirectory,
  offset,
  limit,
) {
  try {
    if (!fs.existsSync(filePath)) {
      // Sync check is acceptable before async read
      return {
        llmContent: '',
        returnDisplay: 'File not found.',
        error: `File not found: ${filePath}`,
      };
    }
    const stats = fs.statSync(filePath); // Sync check
    if (stats.isDirectory()) {
      return {
        llmContent: '',
        returnDisplay: 'Path is a directory.',
        error: `Path is a directory, not a file: ${filePath}`,
      };
    }
    const fileType = detectFileType(filePath);
    const relativePathForDisplay = path
      .relative(rootDirectory, filePath)
      .replace(/\\/g, '/');
    switch (fileType) {
      case 'binary': {
        return {
          llmContent: `Cannot display content of binary file: ${relativePathForDisplay}`,
          returnDisplay: `Skipped binary file: ${relativePathForDisplay}`,
        };
      }
      case 'text': {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const lines = content.split('\n');
        const originalLineCount = lines.length;
        const startLine = offset || 0;
        const effectiveLimit =
          limit === undefined ? DEFAULT_MAX_LINES_TEXT_FILE : limit;
        // Ensure endLine does not exceed originalLineCount
        const endLine = Math.min(startLine + effectiveLimit, originalLineCount);
        // Ensure selectedLines doesn't try to slice beyond array bounds if startLine is too high
        const actualStartLine = Math.min(startLine, originalLineCount);
        const selectedLines = lines.slice(actualStartLine, endLine);
        let linesWereTruncatedInLength = false;
        const formattedLines = selectedLines.map((line) => {
          if (line.length > MAX_LINE_LENGTH_TEXT_FILE) {
            linesWereTruncatedInLength = true;
            return (
              line.substring(0, MAX_LINE_LENGTH_TEXT_FILE) + '... [truncated]'
            );
          }
          return line;
        });
        const contentRangeTruncated = endLine < originalLineCount;
        const isTruncated = contentRangeTruncated || linesWereTruncatedInLength;
        let llmTextContent = '';
        if (contentRangeTruncated) {
          llmTextContent += `[File content truncated: showing lines ${actualStartLine + 1}-${endLine} of ${originalLineCount} total lines. Use offset/limit parameters to view more.]\n`;
        } else if (linesWereTruncatedInLength) {
          llmTextContent += `[File content partially truncated: some lines exceeded maximum length of ${MAX_LINE_LENGTH_TEXT_FILE} characters.]\n`;
        }
        llmTextContent += formattedLines.join('\n');
        return {
          llmContent: llmTextContent,
          returnDisplay: isTruncated ? '(truncated)' : '',
          isTruncated,
          originalLineCount,
          linesShown: [actualStartLine + 1, endLine],
        };
      }
      case 'image':
      case 'pdf': {
        const contentBuffer = await fs.promises.readFile(filePath);
        const base64Data = contentBuffer.toString('base64');
        return {
          llmContent: {
            inlineData: {
              data: base64Data,
              mimeType: mime.lookup(filePath) || 'application/octet-stream',
            },
          },
          returnDisplay: `Read ${fileType} file: ${relativePathForDisplay}`,
        };
      }
      default: {
        // Should not happen with current detectFileType logic
        const exhaustiveCheck = fileType;
        return {
          llmContent: `Unhandled file type: ${exhaustiveCheck}`,
          returnDisplay: `Skipped unhandled file type: ${relativePathForDisplay}`,
          error: `Unhandled file type for ${filePath}`,
        };
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const displayPath = path
      .relative(rootDirectory, filePath)
      .replace(/\\/g, '/');
    return {
      llmContent: `Error reading file ${displayPath}: ${errorMessage}`,
      returnDisplay: `Error reading file ${displayPath}: ${errorMessage}`,
      error: `Error reading file ${filePath}: ${errorMessage}`,
    };
  }
}
// Performance optimized file reading functions
/**
 * Cached file reading with TTL to avoid repeated file system access
 */
export async function readFileWithCache(filePath) {
  const now = Date.now();
  const cached = fileCache.get(filePath);
  if (cached && now - cached.mtime < CACHE_TTL) {
    return cached.content;
  }
  try {
    const [content] = await Promise.all([
      fsAsync.readFile(filePath, 'utf-8'),
      fsAsync.stat(filePath),
    ]);
    fileCache.set(filePath, { content, mtime: now });
    // Clean up old cache entries periodically
    if (fileCache.size > 100) {
      const cutoff = now - CACHE_TTL;
      for (const [key, value] of fileCache.entries()) {
        if (value.mtime < cutoff) {
          fileCache.delete(key);
        }
      }
    }
    return content;
  } catch (error) {
    throw new Error(`Error reading file ${filePath}: ${error}`);
  }
}
/**
 * Async version of isBinaryFile for better performance
 */
export async function isBinaryFileAsync(filePath) {
  try {
    const fileHandle = await fsAsync.open(filePath, 'r');
    try {
      const stats = await fileHandle.stat();
      if (stats.size === 0) {
        return false; // Empty file is not considered binary
      }
      const bufferSize = Math.min(4096, stats.size);
      const buffer = Buffer.alloc(bufferSize);
      const { bytesRead } = await fileHandle.read(buffer, 0, bufferSize, 0);
      if (bytesRead === 0) return false;
      let nonPrintableCount = 0;
      for (let i = 0; i < bytesRead; i++) {
        if (buffer[i] === 0) return true; // Null byte is a strong indicator
        if (buffer[i] < 9 || (buffer[i] > 13 && buffer[i] < 32)) {
          nonPrintableCount++;
        }
      }
      // If >30% non-printable characters, consider it binary
      return nonPrintableCount / bytesRead > 0.3;
    } finally {
      await fileHandle.close();
    }
  } catch {
    return false;
  }
}
/**
 * Batch file reading for better I/O performance
 */
export async function readMultipleFiles(filePaths) {
  const results = new Map();
  const batchSize = 10; // Read 10 files concurrently
  for (let i = 0; i < filePaths.length; i += batchSize) {
    const batch = filePaths.slice(i, i + batchSize);
    const promises = batch.map(async (filePath) => {
      try {
        const content = await readFileWithCache(filePath);
        return { filePath, content, error: null };
      } catch (error) {
        return { filePath, content: '', error };
      }
    });
    const batchResults = await Promise.all(promises);
    for (const result of batchResults) {
      if (!result.error) {
        results.set(result.filePath, result.content);
      }
    }
  }
  return results;
}
//# sourceMappingURL=fileUtils.js.map
