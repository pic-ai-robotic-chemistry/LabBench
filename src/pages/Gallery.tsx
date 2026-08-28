import { useState } from 'react'
import { Link } from 'react-router'
import { styleList } from '@/data/benchmark'
import type { StyleEntry } from '@/data/benchmark'

type StyleTheme = StyleEntry['theme']

type Filter = 'all' | StyleTheme

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'light', label: '浅色' },
  { key: 'dark', label: '深色' },
]

export default function Gallery() {
  const [filter, setFilter] = useState<Filter>('all')

  const visible = styleList.filter((s) => filter === 'all' || s.theme === filter)

  return (
    <div className="min-h-[100dvh] bg-white text-neutral-900">
      {/* Hero */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
            Benchmark Paper Site · Design Style Gallery
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            RoboChem Bench — Style Gallery
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-500">
            同一套 benchmark 内容 × 20 种设计风格。点击任意卡片预览完整的论文页面
            （排行榜、统计数字、图表、任务卡片），帮你选定最终风格。
          </p>

          {/* Filter */}
          <div className="mt-8 flex gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={
                  filter === f.key
                    ? 'rounded-full border border-neutral-900 bg-neutral-900 px-4 py-1.5 text-sm text-white'
                    : 'rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm text-neutral-600 hover:border-neutral-400 hover:text-neutral-900'
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Card grid */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((style) => (
            <Link
              key={style.slug}
              to={`/s/${style.slug}`}
              className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{style.name}</h2>
                  <p className="text-xs text-neutral-400">{style.brand}</p>
                </div>
                <span
                  className={
                    style.theme === 'light'
                      ? 'rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-500'
                      : 'rounded-full border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[11px] text-neutral-300'
                  }
                >
                  {style.theme}
                </span>
              </div>
              <p className="mt-3 flex-1 text-sm text-neutral-500">{style.vibe}</p>
              <span className="mt-4 text-sm font-medium text-neutral-900">
                预览 <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-neutral-400">
          RoboChem Bench Style Gallery · 内容来自 arXiv:2607.23045 真实论文，仅用于风格预览。
        </div>
      </footer>
    </div>
  )
}
