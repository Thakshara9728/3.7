'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  thinking?: string
}

interface PromptSettings {
  id?: string
  mainPrompt: string
  firstMessage: string
  continuePrompt: string
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showThinking, setShowThinking] = useState(true)
  const [thinkingBudget, setThinkingBudget] = useState(10000)
  const [prompts, setPrompts] = useState<PromptSettings>({
    mainPrompt: 'You are a helpful AI assistant.',
    firstMessage: 'Hello! How can I help you today?',
    continuePrompt: 'Please continue.',
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPrompts()
    const savedBudget = localStorage.getItem('thinkingBudget')
    if (savedBudget) {
      setThinkingBudget(Number(savedBudget))
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    localStorage.setItem('thinkingBudget', String(thinkingBudget))
  }, [thinkingBudget])

  const loadPrompts = async () => {
    try {
      const res = await fetch('/api/prompts')
      const data = await res.json()
      if (data) {
        setPrompts(data)
      }
    } catch (error) {
      console.error('Failed to load prompts:', error)
    }
  }

  const savePrompts = async () => {
    try {
      const url = prompts.id ? '/api/prompts' : '/api/prompts'
      const method = prompts.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompts),
      })

      const data = await res.json()
      setPrompts(data)
      setShowSettings(false)
    } catch (error) {
      console.error('Failed to save prompts:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          chatId,
          useExtendedThinking: true,
          thinkingBudget,
        }),
      })

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setChatId(data.chatId)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.content,
          thinking: data.thinking,
        },
      ])
    } catch (error: any) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error.message}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const newChat = () => {
    setMessages([])
    setChatId(null)
  }

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">Claude 3.7</h1>
          <p className="text-xs text-gray-400 mt-1">Extended Thinking + Web Search</p>
        </div>

        <div className="flex-1 p-4">
          <button
            onClick={newChat}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            New Chat
          </button>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-left"
            >
              Prompt Settings
            </button>

            <button
              onClick={() => setShowThinking(!showThinking)}
              className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-left"
            >
              {showThinking ? 'Hide' : 'Show'} Thinking
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
          <div className="space-y-1">
            <div>Model: claude-3.7-sonnet</div>
            <div>Max Tokens: 8K</div>
            <div>Thinking Budget: {(thinkingBudget / 1000).toFixed(0)}K</div>
          </div>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                } rounded-lg p-4`}
              >
                <div className="text-sm font-semibold mb-2 opacity-70">
                  {msg.role === 'user' ? 'You' : 'Claude'}
                </div>

                {msg.thinking && showThinking && (
                  <div className="mb-3 p-3 bg-gray-900 bg-opacity-50 rounded border border-gray-700">
                    <div className="text-xs font-semibold text-purple-400 mb-2">
                      🧠 Extended Thinking
                    </div>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                      {msg.thinking}
                    </div>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-lg p-4 max-w-3xl">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                  <span className="text-gray-400 ml-2">Claude is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4 bg-gray-900">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Message Claude..."
              className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Prompt Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Thinking Budget: {(thinkingBudget / 1000).toFixed(0)}K tokens
                </label>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="1000"
                  value={thinkingBudget}
                  onChange={(e) => setThinkingBudget(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1K</span>
                  <span>50K</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Main System Prompt
                </label>
                <textarea
                  value={prompts.mainPrompt}
                  onChange={(e) =>
                    setPrompts({ ...prompts, mainPrompt: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  placeholder="Main system prompt..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Message
                </label>
                <textarea
                  value={prompts.firstMessage}
                  onChange={(e) =>
                    setPrompts({ ...prompts, firstMessage: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="First message to user..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Continue Prompt
                </label>
                <textarea
                  value={prompts.continuePrompt}
                  onChange={(e) =>
                    setPrompts({ ...prompts, continuePrompt: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="Continue prompt..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePrompts}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
