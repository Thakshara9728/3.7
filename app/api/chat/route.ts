import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { message, chatId, useExtendedThinking = true } = await req.json()

    // Get or create chat
    let chat = chatId
      ? await prisma.chat.findUnique({
          where: { id: chatId },
          include: { messages: true },
        })
      : await prisma.chat.create({
          data: {},
          include: { messages: true },
        })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Get current prompt settings
    const promptSettings = await prisma.prompt.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    // Build messages array
    const messages: Anthropic.MessageParam[] = []

    if (chat.messages.length === 0 && promptSettings?.firstMessage) {
      messages.push({
        role: 'assistant',
        content: promptSettings.firstMessage,
      })
    }

    chat.messages.forEach((msg) => {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })
    })

    messages.push({
      role: 'user',
      content: message,
    })

    // Create message with extended thinking and web search
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 8000,
      system: promptSettings?.mainPrompt || 'You are a helpful AI assistant.',
      messages,
      thinking: useExtendedThinking
        ? {
            type: 'enabled',
            budget_tokens: 10000,
          }
        : undefined,
      tools: [
        {
          type: 'web_search_20250305' as const,
          name: 'web_search',
          query: '',
          include_raw_content: false,
          source_types: ['web'],
          max_results: 5,
        },
      ],
      betas: ['web-search-2025-03-05', 'interleaved-thinking-2025-05-14'],
    } as any)

    // Extract thinking and content
    let thinkingContent = ''
    let textContent = ''

    for (const block of response.content) {
      if (block.type === 'thinking') {
        thinkingContent += block.thinking
      } else if (block.type === 'text') {
        textContent += block.text
      }
    }

    // Save user message
    await prisma.message.create({
      data: {
        chatId: chat.id,
        role: 'user',
        content: message,
      },
    })

    // Save assistant message
    await prisma.message.create({
      data: {
        chatId: chat.id,
        role: 'assistant',
        content: textContent,
        thinking: thinkingContent || null,
      },
    })

    return NextResponse.json({
      content: textContent,
      thinking: thinkingContent,
      chatId: chat.id,
      stopReason: response.stop_reason,
    })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process chat' },
      { status: 500 }
    )
  }
}
