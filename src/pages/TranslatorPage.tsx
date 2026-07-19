import { useState, useRef } from 'react'
import { MessageSquare, AlertCircle, RefreshCw, Send, Loader2 } from 'lucide-react'
import { getTranslation, type AiTranslation } from '../lib/getTranslation'

export function TranslatorPage() {
  const [inputText, setInputText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<AiTranslation | null>(null)
  const [cooldownMsg, setCooldownMsg] = useState<string | null>(null)
  
  // Guard against rapid submit mashing (rate limiting)
  const lastFetchTime = useRef(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const now = Date.now()
    if (now - lastFetchTime.current < 5000) {
      setCooldownMsg('Please wait a few seconds before translating again.')
      // Clear message after the cooldown would be over
      setTimeout(() => setCooldownMsg(null), 3000)
      return
    }

    setCooldownMsg(null)
    setIsSubmitting(true)
    setResult(null)
    
    lastFetchTime.current = Date.now()
    const translationResult = await getTranslation(inputText)
    
    setResult(translationResult)
    setIsSubmitting(false)
  }

  // Define colors for urgency tags
  const getUrgencyStyles = (tag: AiTranslation['urgencyTag']) => {
    switch (tag) {
      case 'Medical Emergency':
        return { bg: 'rgba(220,38,38,0.15)', text: '#F87171', border: 'rgba(248,113,113,0.3)' }
      case 'Security Issue':
        return { bg: 'rgba(217,119,6,0.15)', text: '#FBBF24', border: 'rgba(251,191,36,0.3)' }
      case 'General Request':
      default:
        return { bg: 'rgba(34,197,94,0.15)', text: '#4ADE80', border: 'rgba(74,222,128,0.3)' }
    }
  }

  return (
    <main
      className="flex flex-col items-center min-h-dvh px-6"
      style={{ paddingBottom: '100px', paddingTop: '24px' }}
    >
      {/* Header */}
      <header className="w-full max-w-md text-center mb-8 mt-6">
        <div
          className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: 'rgba(15,15,15,0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 32px rgba(34,197,94,0.08)',
          }}
          aria-hidden="true"
        >
          <MessageSquare size={28} strokeWidth={1.5} style={{ color: '#22C55E' }} />
        </div>
        <h1
          className="text-2xl mb-2"
          style={{ fontFamily: "'Calistoga', serif", color: '#F5F5F5' }}
        >
          AI Translator
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,245,245,0.5)' }}>
          Context-aware multilingual assistance. Type the fan's request below to get an English translation and an urgency assessment.
        </p>
      </header>

      {/* Input Section */}
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="translation-input" className="sr-only">Fan Request</label>
          <textarea
            id="translation-input"
            rows={4}
            className="w-full rounded-2xl p-4 text-sm focus:outline-none transition-colors"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#F5F5F5',
              resize: 'none'
            }}
            placeholder="Type the fan's request here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSubmitting}
            maxLength={1000}
            aria-label="Input foreign language text to translate"
          />
          <div className="text-right text-[10px] uppercase font-bold tracking-wide mt-[-8px]" style={{ color: 'rgba(245,245,245,0.4)' }}>
            {inputText.length} / 1000
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !inputText.trim()}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-opacity"
            style={{
              backgroundColor: inputText.trim() ? '#22C55E' : 'rgba(34,197,94,0.5)',
              color: '#000000',
              fontWeight: 600,
              opacity: isSubmitting ? 0.7 : 1
            }}
            aria-label={isSubmitting ? "Translating text" : "Translate fan request"}
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
            {isSubmitting ? 'Translating...' : 'Translate Request'}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {cooldownMsg && (
        <div className="w-full max-w-md mt-4 p-3 rounded-xl animate-fade-in text-center" style={{ backgroundColor: 'rgba(217,119,6,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
          <p className="text-xs font-medium" style={{ color: '#FBBF24' }}>
            {cooldownMsg}
          </p>
        </div>
      )}

      {result && (
        <div 
          className="w-full max-w-md mt-8 glass-card p-5 animate-fade-in"
          aria-live="polite"
          role="region"
          aria-label="Translation Result"
        >
          {result.source === 'fallback' && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(248,113,113,0.3)' }}>
              <AlertCircle size={16} style={{ color: '#F87171' }} aria-hidden="true" />
              <p className="text-xs" style={{ color: '#FCA5A5' }}>
                Translation failed. Check your API key or network connection.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold tracking-tight text-[#F5F5F5]">
              English Translation
            </h2>
            <div 
              className="px-2.5 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5"
              style={{
                backgroundColor: getUrgencyStyles(result.urgencyTag).bg,
                borderColor: getUrgencyStyles(result.urgencyTag).border,
                color: getUrgencyStyles(result.urgencyTag).text
              }}
              aria-label={`Urgency: ${result.urgencyTag}`}
            >
              {result.urgencyTag === 'General Request' ? <RefreshCw size={12} /> : <AlertCircle size={12} />}
              {result.urgencyTag}
            </div>
          </div>
          
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,245,245,0.85)' }}>
            {result.englishTranslation}
          </p>

          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] uppercase font-mono-data tracking-wider" style={{ color: 'rgba(245,245,245,0.2)' }}>
              {result.source === 'gemini' ? 'POWERED BY GEMINI 2.0 FLASH' : 'OFFLINE — USING FALLBACK RESPONSE'}
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
