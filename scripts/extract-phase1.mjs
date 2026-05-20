#!/usr/bin/env node
/**
 * One-shot (re-runnable): pull inline CSS/JS from index.html → styles.css + src/app.js
 */
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');

const styleMatch = html.match(/<style>\n?([\s\S]*?)\n?<\/style>/);
if (!styleMatch) throw new Error('No <style> block found');
writeFileSync('styles.css', styleMatch[1].trimEnd() + '\n');

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
const inline = scripts.find((m) => m[1].trim().startsWith('const DSM='));
if (!inline) throw new Error('No inline app script found');
writeFileSync('src/app.js', inline[1].trimEnd() + '\n');

const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
if (!bodyMatch) throw new Error('No <body>');
let body = bodyMatch[1];
body = body.replace(/<script src="dist\/dt\.js"><\/script>\s*/g, '');
body = body.replace(/<script>[\s\S]*?<\/script>\s*/g, '');

const shell = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Daily Tracker">
<meta name="color-scheme" content="dark">
<title>Daily Tracker</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
${body.trim()}
<script src="dist/app.js"></script>
</body>
</html>
`;

writeFileSync('index.html', shell);
console.log('Extracted styles.css, src/app.js, and index.html shell');
