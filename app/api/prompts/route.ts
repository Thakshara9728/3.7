import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const prompt = await prisma.prompt.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(prompt)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prompts' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { mainPrompt, firstMessage, continuePrompt } = await req.json()

    const prompt = await prisma.prompt.create({
      data: {
        mainPrompt,
        firstMessage,
        continuePrompt,
      },
    })

    return NextResponse.json(prompt)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create prompt' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, mainPrompt, firstMessage, continuePrompt } = await req.json()

    const prompt = await prisma.prompt.update({
      where: { id },
      data: {
        mainPrompt,
        firstMessage,
        continuePrompt,
      },
    })

    return NextResponse.json(prompt)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update prompt' },
      { status: 500 }
    )
  }
}
