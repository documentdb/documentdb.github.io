import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// A --password container argument is visible to anyone on the host (`ps`,
// `podman top`); the image reads USERNAME/PASSWORD from the environment instead.
const root = path.resolve(__dirname, '..');

function sources(): string[] {
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return /\.(tsx?|md)$/.test(entry.name) ? [full] : [];
    });
  return [...walk(path.join(root, 'app')), ...walk(path.join(root, 'blogs', '_posts')), path.join(root, 'PACKAGE-INSTALL.md')];
}

// A run command plus its backslash-continued lines, in source or rendered form.
function runCommands(text: string): string[] {
  const lines = text.split('\n');
  const commands: string[] = [];
  lines.forEach((line, index) => {
    if (!/\b(docker|podman) run\b/.test(line)) return;
    const command = [line];
    for (let next = index; /\\\s*$/.test(lines[next]) && next + 1 < lines.length; next += 1) {
      command.push(lines[next + 1]);
    }
    commands.push(command.join('\n'));
  });
  return commands;
}

describe('container credentials', () => {
  it('finds the site run commands', () => {
    const count = sources().flatMap((file) => runCommands(fs.readFileSync(file, 'utf8'))).length;
    expect(count).toBeGreaterThan(10);
  });

  it.each(sources().map((file) => [path.relative(root, file), file]))('%s passes no credentials as container arguments', (_name, file) => {
    for (const command of runCommands(fs.readFileSync(file, 'utf8'))) {
      expect(command).not.toMatch(/--(password|username)\b/);
      // docker run options must come before the image; after it they are container arguments.
      const image = command.search(/ghcr\.io\/documentdb\/documentdb\/documentdb-local:/);
      for (const option of ['-e USERNAME=', '-e PASSWORD=']) {
        if (image >= 0 && command.includes(option)) {
          expect(command.indexOf(option)).toBeLessThan(image);
        }
      }
    }
  });
});
