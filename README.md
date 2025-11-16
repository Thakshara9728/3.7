# Claude 3.7 Chat App

Modern Next.js webapp with Claude Sonnet 3.7 API, featuring extended thinking and web search capabilities.

## Features

- **Claude Sonnet 3.7**: Latest Claude model (claude-3-7-sonnet-20250219)
- **Extended Thinking**: 10K token thinking budget for deeper reasoning
- **Web Search**: Integrated web search tool for current information
- **Prompt Management**: Store and manage 3 prompt types (main, first message, continue)
- **Prisma Database**: SQLite database for chat history and prompts
- **Modern UI**: Clean, dark mode interface with Tailwind CSS
- **Real-time Chat**: Instant messaging with thinking visualization

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```env
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

3. Initialize database:
```bash
npx prisma generate
npx prisma db push
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Next.js 15**: App Router, Server Components
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **Prisma**: Database ORM
- **Anthropic SDK**: Claude API integration
- **SQLite**: Local database

## API Routes

- `POST /api/chat`: Send messages to Claude
- `GET /api/prompts`: Get current prompts
- `POST /api/prompts`: Create new prompts
- `PUT /api/prompts`: Update prompts

## Usage

1. **Chat**: Type messages in the input field
2. **Settings**: Configure system prompts, first message, and continue prompts
3. **Thinking**: Toggle extended thinking visualization
4. **New Chat**: Start fresh conversation

## Environment

Built with 2025 best practices:
- Server Components by default
- Minimal client-side JavaScript
- Static-first rendering
- Type-safe database queries
