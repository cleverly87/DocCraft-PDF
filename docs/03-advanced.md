# Advanced Configuration

Learn how to customize DocCraft PDF for your specific needs.

## Custom Styling

### Modifying pandoc.defaults.yml

The `pandoc.defaults.yml` file controls the PDF appearance:

```yaml
# Change document class
variables:
  documentclass: report  # article, report, book

# Adjust margins
geometry: margin=1.5in

# Font customization
mainfont: "Times New Roman"
monofont: "Courier New"
fontsize: 12pt
```

### Custom LaTeX Templates

Create custom headers and footers in `templates/brand-header.tex`:

```latex
% Add your company logo
\fancyhead[R]{\includegraphics[height=1cm]{assets/your-logo.png}}

% Custom footer text
\fancyfoot[L]{\small © 2025 Your Company}
```

## Environment Configuration

Configure your `.env` file:

```bash
# Server settings
PORT=3000
NODE_ENV=production

# Directories
DOCS_DIR=./docs
OUTPUT_DIR=./pdf
ASSETS_DIR=./assets

# Caching
ENABLE_CACHE=true
CACHE_MAX_AGE=3600

# Logging
LOG_LEVEL=INFO
```

## API Security

### Add Authentication

```javascript
// In src/server.js
const apiKey = process.env.API_KEY;

app.use('/pdf', (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

### Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/pdf', limiter);
```

## Deployment

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:16-alpine

# Install Pandoc and LaTeX
RUN apk add --no-cache pandoc texlive-full

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t doccraft-pdf .
docker run -p 3000:3000 doccraft-pdf
```

### Production Best Practices

1. **Use a reverse proxy** (nginx, Apache)
2. **Enable HTTPS** with SSL certificates
3. **Set up monitoring** (health checks, logging)
4. **Configure backups** for generated PDFs
5. **Use environment variables** for secrets

## Performance Optimization

### Caching Strategy

Enable caching to avoid regenerating identical PDFs:

```bash
ENABLE_CACHE=true
CACHE_MAX_AGE=86400  # 24 hours
```

### Clean Old Cache

Schedule periodic cache cleanup:

```javascript
// In src/server.js
const pdfService = require('./services/pdfService');

// Clean cache every 24 hours
setInterval(() => {
  pdfService.cleanOldCache(24 * 60 * 60 * 1000);
}, 24 * 60 * 60 * 1000);
```

## Troubleshooting

### Memory Issues

For large documents, increase Node.js memory:

```bash
node --max-old-space-size=4096 src/server.js
```

### Slow Generation

- Enable caching
- Optimize images in assets
- Reduce TOC depth
- Use simpler LaTeX templates

## Next Steps

- Review the API reference
- Explore example use cases
- Join the community
