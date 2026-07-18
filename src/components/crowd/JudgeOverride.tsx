/**
 * JudgeOverride.tsx — UI component for evaluator dataset override.
 *
 * Visually fits the dark-mode glassmorphic theme. Represents a distinct dashboard section.
 *
 * Features:
 * - CSV drag-and-drop or file upload input
 * - Validation error reports displayed inline (stops app crash, guides judge)
 * - State banner: "Simulated live feed" (green) vs "Using uploaded judge data" (orange/amber)
 * - "Reset to simulation" button to clear override state and resume ticker
 */

import React, { useState, useRef } from 'react'
import { Upload, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { useCrowdStore } from '../../store/useCrowdStore'
import { parseJudgeCsv } from '../../lib/csvParser'

export function JudgeOverride() {
  const isOverrideActive = useCrowdStore(s => s.isOverrideActive)
  const isFirebaseConnected = useCrowdStore(s => s.isFirebaseConnected)
  const setOverrideData = useCrowdStore(s => s.setOverrideData)
  const resetToSimulation = useCrowdStore(s => s.resetToSimulation)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMsg(null)
    setSuccessMsg(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const result = parseJudgeCsv(text)

      if (!result.success) {
        setErrorMsg(result.error || 'Parsing failed.')
        // Clear input so user can try uploading same file name again
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      // Apply dataset override to Zustand store + Firebase RTDB
      setOverrideData(result.gates, result.facilities)
      
      const parts = []
      if (result.gates) parts.push(`${Object.keys(result.gates).length} gates`)
      if (result.facilities) parts.push(`${Object.keys(result.facilities).length} facilities`)
      
      setSuccessMsg(`Successfully imported ${parts.join(' and ')}. Simulator paused.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }

    reader.onerror = () => {
      setErrorMsg('Failed to read file from disk.')
    }

    reader.readAsText(file)
  }

  const handleReset = () => {
    setErrorMsg(null)
    setSuccessMsg(null)
    resetToSimulation()
  }

  // Simulated CSV content for quick headless verification and judge convenience
  const MOCK_VALID_CSV = `id,name,section,capacityPct,trend,redirectTo,waitMinutes
A,Gate A,North Main,25,-1,null,1
B,Gate B,North East,35,0,null,2
C,Gate C,East VIP,12,-5,null,1
D,Gate D,East Stand,88,4,E,13
E,Gate E,South East,95,15,null,20
F,Gate F,South Main,22,-3,null,1
G,Gate G,West Stand,45,2,null,3
H,Gate H,North West,10,-2,null,0`

  const MOCK_INVALID_CSV = `id,name,section,capacityPct,trend,redirectTo,waitMinutes
A,Gate A,North Main,250,-1,null,1
B,Gate B,North East,35,0,null,2`

  const handleSimulateInject = (csvText: string) => {
    setErrorMsg(null)
    setSuccessMsg(null)

    const result = parseJudgeCsv(csvText)
    if (!result.success) {
      setErrorMsg(result.error || 'Parsing failed.')
      return
    }

    setOverrideData(result.gates, result.facilities)
    setSuccessMsg(`Simulated import of 8 gates. Simulator paused.`)
  }

  return (
    <section
      className="glass-card p-5 border border-[#262626] rounded-xl bg-[#0F0F0F]/60 backdrop-blur-md shadow-lg"
      aria-label="Judge Data Override Control Panel"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[#F5F5F5] font-bold text-base tracking-tight">
            Judge Data Override
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Upload custom gate and facility data (CSV) to see how the Gemini reasoning engine analyzes it and generates redirect recommendations in real time.
          </p>
        </div>

        {/* State Banner indicator */}
        <div className="flex items-center gap-2">
          {isOverrideActive ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D97706]/15 border border-[#D97706]/35 text-[#D97706]"
              role="status"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
              Using uploaded judge data
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#22C55E]/15 border border-[#22C55E]/35 text-[#22C55E]"
              role="status"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              Simulated live feed
            </span>
          )}

          {/* Database Connectivity badge */}
          {isFirebaseConnected ? (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">
              DB Sync
            </span>
          ) : (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/40" title="Running in local-only fallback mode. Check internet connection.">
              Local Only
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Action Card */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#262626] hover:border-white/20 transition-colors rounded-lg p-6 bg-white/[0.01]">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
            id="csv-file-input"
            aria-label="Upload CSV dataset"
          />
          <label
            htmlFor="csv-file-input"
            className="cursor-pointer flex flex-col items-center gap-2 text-center"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70">
              <Upload size={18} />
            </div>
            <div>
              <span className="text-sm font-semibold text-[#F5F5F5] hover:underline">
                Upload CSV File
              </span>
              <p className="text-[10px] text-white/30 mt-1">
                Drop your gates or facilities dataset here. .csv only.
              </p>
            </div>
          </label>
        </div>

        {/* Override status & controls info */}
        <div className="flex flex-col justify-between p-4 bg-[#141414]/40 border border-[#262626] rounded-lg">
          <div className="text-xs leading-relaxed text-white/70">
            <span className="font-semibold text-white">Expected CSV Format:</span>
            <ul className="list-disc pl-4 mt-1 space-y-1 text-white/50">
              <li>
                <strong className="text-white/70">Gates</strong>: <code className="font-mono text-[10px]">id,name,section,capacityPct,trend,[redirectTo],[waitMinutes]</code>
              </li>
              <li>
                <strong className="text-white/70">Facilities</strong>: <code className="font-mono text-[10px]">id,type,label,location,waitMinutes</code>
              </li>
            </ul>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isOverrideActive && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-[#262626] bg-[#1A1A1A] hover:bg-[#222] text-[#F5F5F5] transition-colors"
              >
                <RefreshCw size={12} />
                Reset
              </button>
            )}

            {/* Test helper injection buttons */}
            <button
              id="test-inject-valid"
              onClick={() => handleSimulateInject(MOCK_VALID_CSV)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider border border-[#262626] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              Mock Valid
            </button>
            <button
              id="test-inject-invalid"
              onClick={() => handleSimulateInject(MOCK_INVALID_CSV)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider border border-[#262626] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              Mock Invalid
            </button>
          </div>
        </div>
      </div>

      {/* Inline Feedback Alerts */}
      {errorMsg && (
        <div
          className="mt-4 flex items-start gap-2 p-3 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 text-xs text-[#EF4444]"
          role="alert"
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Import Error:</span> {errorMsg}
          </div>
        </div>
      )}

      {successMsg && (
        <div
          className="mt-4 flex items-start gap-2 p-3 rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 text-xs text-[#22C55E]"
          role="alert"
        >
          <CheckCircle size={14} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Success:</span> {successMsg}
          </div>
        </div>
      )}
    </section>
  )
}
