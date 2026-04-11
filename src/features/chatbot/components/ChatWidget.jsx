import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Trash2, Loader2, MessageSquare } from 'lucide-react'
import { chatbotService } from '../services/chatbotService'

const ChatWidget = () => {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'assistant',
      text: 'Halo! Saya asisten AI Akademihub. Ada yang bisa saya bantu?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { id: Date.now(), role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const { data, error } = await chatbotService.sendMessage(text)

    setLoading(false)

    if (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          text: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
          isError: true,
        },
      ])
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          text: data?.reply ?? 'Maaf, saya tidak dapat merespon saat ini.',
        },
      ])
    }
  }

  const handleClearSession = async () => {
    await chatbotService.clearSession()
    setMessages([
      {
        id: 0,
        role: 'assistant',
        text: 'Riwayat percakapan telah dihapus. Ada yang bisa saya bantu?',
      },
    ])
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-all"
        aria-label="Buka AI Asisten"
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-80 sm:w-96 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
          {/* Header */}
          <div className="flex items-center gap-3 bg-violet-600 px-4 py-3 text-white">
            <Bot className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold leading-none">AI Asisten Sekolah</p>
              <p className="mt-0.5 text-xs text-violet-200">Didukung oleh OpenAI GPT-4o</p>
            </div>
            <button
              onClick={handleClearSession}
              className="rounded p-1 hover:bg-violet-700 transition-colors"
              title="Hapus riwayat percakapan"
              aria-label="Hapus riwayat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 hover:bg-violet-700 transition-colors"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-80">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="mr-2 mt-0.5 h-7 w-7 shrink-0 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-br-sm'
                      : msg.isError
                      ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-bl-sm'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="mr-2 mt-0.5 h-7 w-7 shrink-0 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 dark:bg-gray-700">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 dark:border-gray-700 p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pesan… (Enter untuk kirim)"
                rows={1}
                disabled={loading}
                className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                style={{ maxHeight: '96px', overflowY: 'auto' }}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Kirim pesan"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1.5 text-center text-xs text-gray-400">
              Shift+Enter untuk baris baru
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatWidget
