import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Download } from 'lucide-react';
import { KOTLIN_PROJECT_FILES, KotlinFile } from '../../data/kotlinSourceCode';
import { haptics } from '../../utils/audio';

interface KotlinSourceViewerModalProps {
  onDismiss: () => void;
}

export const KotlinSourceViewerModal: React.FC<KotlinSourceViewerModalProps> = ({
  onDismiss,
}) => {
  const [selectedFile, setSelectedFile] = useState<KotlinFile>(KOTLIN_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    haptics.playSnap();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    a.click();
    URL.revokeObjectURL(url);
    haptics.playTick();
  };

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl h-[88vh] bg-slate-950 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Android Jetpack Compose Native Source Code
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono">
                  Kotlin 2.0 · Compose BOM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Single-Activity architecture with custom canvas radial physics and DataStore preferences.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-medium transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy File'}</span>
            </button>

            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-medium transition-all cursor-pointer shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={onDismiss}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace: Left File Selector + Right Code View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File sidebar */}
          <div className="w-full md:w-72 bg-slate-900/60 border-r border-white/10 p-3 overflow-y-auto shrink-0 flex md:flex-col gap-1.5">
            <div className="hidden md:block text-[11px] font-mono uppercase text-slate-400 px-3 py-2 font-semibold">
              Project Structure
            </div>
            {KOTLIN_PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.name === file.name;
              return (
                <button
                  key={file.name}
                  onClick={() => {
                    haptics.playTick();
                    setSelectedFile(file);
                  }}
                  className={`flex-1 md:flex-initial flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-mono">{file.name}</div>
                    <div className="text-[10px] text-slate-400 truncate hidden md:block">
                      {file.path}
                    </div>
                  </div>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* File info bar */}
            <div className="px-5 py-2.5 bg-slate-900/40 border-b border-white/5 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
              <span className="text-slate-300">{selectedFile.path}</span>
              <span>{selectedFile.code.split('\n').length} lines · {selectedFile.language}</span>
            </div>

            {/* Description Banner */}
            <div className="px-5 py-2 bg-blue-950/20 border-b border-blue-500/20 text-xs text-blue-300 shrink-0">
              💡 {selectedFile.description}
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-5 font-mono text-xs text-slate-200 leading-relaxed bg-[#07090e]">
              <pre>
                <code>{selectedFile.code}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
