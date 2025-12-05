# InfiWiki

An infinite-scroll Wikipedia reader that lets you discover and explore random Wikipedia articles endlessly. Search for specific topics, filter by categories, or just keep scrolling through a curated stream of knowledge.

![InfiWiki](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

## Features

### 🌊 Infinite Scrolling
- Automatically loads new Wikipedia articles as you scroll
- Batch loading of 5 articles at once for smooth, uninterrupted reading
- Smart prefetching with duplicate detection

### 🔍 Smart Search
- Search for any Wikipedia article instantly
- Automatically finds the best match for your query
- Searched articles are added to the top of your feed

### 📚 Category Filtering
- Browse articles from specific Wikipedia categories
- Curated categories: Science, History, Technology, Geography, Arts, Sports
- Excludes meta-pages (lists, indexes, timelines) for quality content

### 🎯 Text Selection Navigation
- Select any text in an article to navigate to related Wikipedia pages
- Seamlessly jump between topics while maintaining your reading flow

### 🌓 Dark Mode
- Fully supports light and dark themes
- Smooth theme transitions
- Respects system preferences

### 🎨 Clean UI
- Minimalist design with monospace typography
- Responsive layout optimized for all screen sizes
- Mobile-first approach with touch-friendly interactions

### 🔒 Secure Content
- HTML sanitization with DOMPurify
- Safe rendering of Wikipedia content
- Fixed internal links to prevent 404s

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **UI Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Data Fetching:** [TanStack Query](https://tanstack.com/query) (React Query)
- **UI Components:** [Radix UI](https://www.radix-ui.com/)
- **Theme Management:** [next-themes](https://github.com/pacocoursey/next-themes)
- **HTML Sanitization:** [DOMPurify](https://github.com/cure53/DOMPurify)
- **Testing:** [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/infiwiki.git
cd infiwiki
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
infiwiki/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   └── wiki/
│   │   │       ├── random/       # Random article endpoint
│   │   │       ├── search/       # Search endpoint
│   │   │       └── [title]/      # Get article by title
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   └── globals.css           # Global styles
│   ├── components/               # React components
│   │   ├── reader.tsx            # Main infinite scroll reader
│   │   ├── article-view.tsx      # Individual article display
│   │   ├── top-menu.tsx          # Navigation menu
│   │   ├── category-selector.tsx # Category filter dropdown
│   │   ├── selection-navigator.tsx # Text selection handler
│   │   └── ui/                   # Reusable UI components
│   ├── lib/                      # Utility libraries
│   │   ├── wiki.client.ts        # Wikipedia API client
│   │   ├── api.client.ts         # Frontend API wrapper
│   │   └── utils.ts              # Helper functions
│   └── server/                   # Server-side handlers
│       └── handlers/             # API route handlers
├── tests/                        # Test files
├── public/                       # Static assets
└── package.json
```

## API Routes

### `GET /api/wiki/random`
Get a random Wikipedia article.

**Query Parameters:**
- `category` (optional): Filter by Wikipedia category

**Response:**
```json
{
  "title": "Article Title",
  "url": "https://en.wikipedia.org/wiki/Article_Title",
  "html": "<div>...</div>",
  "text": "Plain text content",
  "description": "Brief description"
}
```

### `GET /api/wiki/[title]`
Get a specific Wikipedia article by title.

**Response:** Same as `/api/wiki/random`

### `GET /api/wiki/search?q=query`
Search for Wikipedia articles.

**Query Parameters:**
- `q`: Search query

**Response:**
```json
{
  "title": "Best matching article title"
}
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### Code Style

This project uses:
- ESLint for linting
- TypeScript for type checking
- Prettier-compatible formatting (via ESLint)

### Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Test files are located in the `tests/` directory and cover:
- API route handlers
- UI components
- Infinite scroll functionality
- Search and navigation features

## Key Implementation Details

### Infinite Scrolling
- Uses `useInfiniteQuery` from TanStack Query
- Implements `IntersectionObserver` for scroll detection
- Batch loads 5 articles at once with staggered delays
- Maintains a `Set` of seen URLs to prevent duplicates

### Wikipedia API Integration
- Uses Wikipedia's REST API v1
- Fetches article summaries and mobile HTML
- Sanitizes HTML content and fixes internal links
- Implements proper User-Agent headers

### Category Filtering
- Recursively explores Wikipedia categories and subcategories
- Filters out meta-pages (lists, indexes, timelines, etc.)
- Limits to 100 articles per category for performance

### Content Sanitization
- Removes citation boxes, navigation elements, and metadata
- Fixes relative Wikipedia links to external URLs
- Strips empty elements and whitespace
- Uses DOMPurify for XSS protection

## Deployment

### Netlify (Recommended)

This project includes a `netlify.toml` configuration file for easy deployment:

1. Connect your repository to Netlify
2. Netlify will automatically detect the Next.js framework
3. Deploy!

### Vercel

```bash
npm install -g vercel
vercel
```

### Other Platforms

Build the production bundle:
```bash
npm run build
```

Then deploy the `.next` directory to your hosting platform.

## Environment Variables

No environment variables are required for basic functionality. All Wikipedia API calls are made using public endpoints.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Wikipedia for providing the free encyclopedia API
- Next.js team for the amazing framework
- TanStack for React Query
- Radix UI for accessible components

## Contact

For questions or feedback, please open an issue on GitHub.

---

Built with ❤️ using Next.js and the Wikipedia API
