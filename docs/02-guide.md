# User Guide

This guide will walk you through using DocCraft PDF to generate beautiful PDFs from your Markdown files.

## Getting Started

### Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v16 or higher)
2. **Pandoc** (v2.0 or higher)
3. **XeLaTeX** (usually comes with TeX Live or MiKTeX)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/DocCraft-PDF.git
cd DocCraft-PDF

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start the server
npm start
```

## Using the API

### Basic Request

Generate a PDF by making a GET request to the `/pdf` endpoint:

```bash
GET http://localhost:3000/pdf?docs=01-intro.md,02-guide.md&title=My%20Document&author=Andrew
```

### Query Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `docs` | Yes | Comma-separated list of Markdown files | `01-intro.md,02-guide.md` |
| `title` | No | Document title | `My Document` |
| `subtitle` | No | Document subtitle | `Version 1.0` |
| `author` | No | Document author | `Andrew` |
| `date` | No | Document date | `November 3, 2025` |
| `download` | No | Download mode: `inline` or `attachment` | `inline` |

### Example Requests

#### Simple Request

```bash
curl "http://localhost:3000/pdf?docs=01-intro.md&title=Introduction"
```

#### Multiple Files with Metadata

```bash
curl "http://localhost:3000/pdf?docs=01-intro.md,02-guide.md&title=Complete%20Guide&subtitle=User%20Manual&author=DocCraft%20Team&download=attachment" --output document.pdf
```

#### Using JavaScript Fetch

```javascript
const url = new URL('http://localhost:3000/pdf');
url.searchParams.set('docs', '01-intro.md,02-guide.md');
url.searchParams.set('title', 'My Document');
url.searchParams.set('author', 'Andrew');

fetch(url)
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.pdf';
    a.click();
  });
```

## Using the CLI

Generate PDFs directly from the command line:

```bash
# Use default settings
npm run pdf:demo

# Custom settings
node src/cli.js --docs=01-intro.md,02-guide.md --title="My Document" --author="Andrew"
```

## File Organization

Place your Markdown files in the `docs/` directory:

```
docs/
├── 01-intro.md
├── 02-guide.md
├── 03-advanced.md
└── 04-api-reference.md
```

## Markdown Features

DocCraft PDF supports all standard Markdown features plus:

### Code Blocks

```python
def hello_world():
    print("Hello, DocCraft!")
```

### Tables

| Feature | Status |
|---------|--------|
| Headers | ✅ |
| Tables | ✅ |
| Code | ✅ |

### Lists

- Unordered lists
- With multiple items
  - And nested items

1. Ordered lists
2. Are also supported
3. With automatic numbering

### Links and Images

[Visit DocCraft](https://example.com)

![Logo](../assets/logo.png)

## Troubleshooting

### Pandoc Not Found

If you see "Pandoc is not installed", install it:

- **Windows**: Download from [pandoc.org](https://pandoc.org/installing.html)
- **Mac**: `brew install pandoc`
- **Linux**: `sudo apt-get install pandoc`

### XeLaTeX Errors

Ensure you have a LaTeX distribution installed:

- **Windows**: [MiKTeX](https://miktex.org/)
- **Mac**: [MacTeX](https://www.tug.org/mactex/)
- **Linux**: `sudo apt-get install texlive-xetex`

### File Not Found

Ensure your Markdown files are in the `docs/` directory and use the correct filename.

## Next Steps

- Learn about advanced customization
- Explore API reference
- Deploy to production
