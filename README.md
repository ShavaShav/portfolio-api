# portfolio-api

Vercel Functions backend for the portfolio AI companion.

## Endpoints

- `GET /api/health`
- `POST /api/chat`

## Local

1. `npm install`
2. Set `OPENAI_API_KEY` in `.env.local`
3. `npm run dev`

## Notes

- Uses OpenAI embeddings (`text-embedding-3-small`) with in-memory cosine retrieval.
- Uses streamed chat completion responses (`gpt-4o-mini`).
