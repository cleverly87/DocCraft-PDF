# DocCraft PDF

A powerful Node.js microservice for converting Markdown files into beautifully styled PDFs using Pandoc and XeLaTeX.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)

## 🚀 Features

- **📄 Multiple Files**: Combine multiple Markdown files into a single PDF
- **🎨 Custom Branding**: Add logos, headers, and footers
- **📋 Metadata Control**: Set title, subtitle, author, and date
- **📑 Table of Contents**: Automatic TOC generation with configurable depth
- **💻 Syntax Highlighting**: Beautiful code blocks with syntax highlighting
- **⚡ Smart Caching**: Avoid regenerating identical PDFs
- **🌐 RESTful API**: Simple HTTP endpoint for PDF generation
- **🛠️ CLI Tool**: Generate PDFs from the command line

## 📋 Prerequisites

Before you begin, ensure you have installed:

1. **Node.js** (v16 or higher)
   - Download from [nodejs.org](https://nodejs.org/)

2. **Pandoc** (v2.0 or higher)
   - **Windows**: Download from [pandoc.org](https://pandoc.org/installing.html)
   - **Mac**: `brew install pandoc`
   - **Linux**: `sudo apt-get install pandoc`

3. **XeLaTeX** (part of TeX Live or MiKTeX)
   - **Windows**: [MiKTeX](https://miktex.org/)
   - **Mac**: [MacTeX](https://www.tug.org/mactex/)
   - **Linux**: `sudo apt-get install texlive-xetex texlive-fonts-recommended`

## 📦 Installation

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

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## 🎯 Quick Start

### Using the API

Generate a PDF by making a GET request:

```bash
curl "http://localhost:3000/pdf?docs=01-intro.md,02-guide.md&title=My%20Document&author=Andrew" --output document.pdf
```

### Using the CLI

Generate PDFs directly from the command line:

```bash
npm run pdf:demo
```

Or with custom parameters:

```bash
node src/cli.js --docs=01-intro.md,02-guide.md --title="My Document" --author="Andrew"
```

## 📖 API Reference

### Endpoint

```
GET /pdf
```

### Query Parameters

| Parameter | Required | Type | Description | Example |
|-----------|----------|------|-------------|---------|
| `docs` | ✅ Yes | string | Comma-separated list of Markdown files | `01-intro.md,02-guide.md` |
| `title` | ❌ No | string | Document title | `My Document` |
| `subtitle` | ❌ No | string | Document subtitle | `Version 1.0` |
| `author` | ❌ No | string | Document author | `Andrew` |
| `date` | ❌ No | string | Document date | `November 3, 2025` |
| `download` | ❌ No | string | Download mode: `inline` or `attachment` | `inline` |

### Example Requests

**Basic Request:**
```bash
GET http://localhost:3000/pdf?docs=01-intro.md&title=Introduction
```

**Multiple Files with Metadata:**
```bash
GET http://localhost:3000/pdf?docs=01-intro.md,02-guide.md,03-advanced.md&title=Complete%20Guide&subtitle=User%20Manual&author=DocCraft%20Team&download=attachment
```

**Using JavaScript:**
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

## 🗂️ Project Structure

```
DocCraft-PDF/
├── docs/                    # Input Markdown files
│   ├── 01-intro.md
│   ├── 02-guide.md
│   └── 03-advanced.md
├── pdf/                     # Generated PDF output (cached)
├── assets/                  # Images and logo for PDFs
│   └── logo.png
├── templates/               # Custom LaTeX templates
│   └── brand-header.tex
├── src/
│   ├── server.js           # Express server
│   ├── cli.js              # CLI tool
│   ├── services/
│   │   └── pdfService.js   # PDF generation logic
│   └── utils/
│       ├── logger.js       # Logging utility
│       └── validators.js   # Input validation
├── pandoc.defaults.yml      # Pandoc configuration
├── package.json
├── .env.example
└── README.md
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Server settings
PORT=3000
NODE_ENV=development

# Directory paths
DOCS_DIR=./docs
OUTPUT_DIR=./pdf
ASSETS_DIR=./assets
TEMPLATES_DIR=./templates

# Pandoc configuration
PANDOC_DEFAULTS=./pandoc.defaults.yml

# Cache settings
ENABLE_CACHE=true
CACHE_MAX_AGE=3600
```

### Customizing Styling

Edit `pandoc.defaults.yml` to customize PDF appearance:

```yaml
# Change fonts
mainfont: Arial
monofont: Courier New
fontsize: 11pt

# Adjust margins
geometry: margin=1in

# Table of contents
toc-depth: 3
number-sections: true
```

### Custom Branding

Edit `templates/brand-header.tex` to customize headers and footers:

```latex
% Add your logo
\fancyhead[R]{\includegraphics[height=0.8cm]{assets/your-logo.png}}

% Custom footer
\fancyfoot[L]{\small © 2025 Your Company}
```

## 🛡️ Security

- **Input Sanitization**: All filenames are sanitized to prevent path traversal attacks
- **File Type Validation**: Only `.md` files are allowed
- **Safe File Access**: Files are restricted to the `docs/` directory
- **Helmet**: Security headers enabled via Helmet middleware
- **CORS**: Configurable CORS support

## 🧪 Testing

Try the demo files:

```bash
npm run pdf:demo
```

This will generate a PDF from the example Markdown files in the `docs/` directory.

## 🐛 Troubleshooting

### Pandoc Not Found

**Error:** "Pandoc is not installed or not available in PATH"

**Solution:** Install Pandoc following the [installation guide](https://pandoc.org/installing.html) and ensure it's in your system PATH.

### XeLaTeX Errors

**Error:** Pandoc fails with LaTeX errors

**Solution:** 
- Ensure you have a LaTeX distribution installed
- On Windows, use MiKTeX and let it install missing packages automatically
- On Linux, install the full texlive package: `sudo apt-get install texlive-full`

### File Not Found

**Error:** "Missing files: example.md"

**Solution:** Ensure your Markdown files are in the `docs/` directory with the correct filename.

### Port Already in Use

**Error:** "Port 3000 is already in use"

**Solution:** Change the port in `.env` or stop the process using port 3000.

## 📚 Additional Resources

- [Pandoc User Guide](https://pandoc.org/MANUAL.html)
- [Markdown Syntax](https://www.markdownguide.org/)
- [LaTeX Documentation](https://www.latex-project.org/help/documentation/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Andrew**

## 🙏 Acknowledgments

- [Pandoc](https://pandoc.org/) - Universal document converter
- [Express](https://expressjs.com/) - Fast, unopinionated web framework
- [Eisvogel LaTeX Template](https://github.com/Wandmalfarbe/pandoc-latex-template) - Inspiration for LaTeX styling

---

**Happy PDF Generation! 📄✨**
