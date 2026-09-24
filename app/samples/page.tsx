'use client';

import { useState, useMemo } from 'react';
import { samples } from '../data/samples';
import { SampleCard } from '../components/SampleCard';
import { Sample } from '../types/Sample';

const LANGUAGES = Array.from(new Set(samples.map((s) => s.language))).sort();
const INDUSTRIES = Array.from(new Set(samples.map((s) => s.industry))).sort();
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'] as const;

function applyFilters(
  items: Sample[],
  query: string,
  language: string,
  industry: string,
  difficulty: string,
): Sample[] {
  const q = query.toLowerCase().trim();
  return items.filter((s) => {
    if (language && s.language !== language) return false;
    if (industry && s.industry !== industry) return false;
    if (difficulty && s.difficulty !== difficulty) return false;
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q)) ||
      s.language.toLowerCase().includes(q) ||
      s.industry.toLowerCase().includes(q)
    );
  });
}

export default function Samples() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [industry, setIndustry] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const filtered = useMemo(
    () => applyFilters(samples, query, language, industry, difficulty),
    [query, language, industry, difficulty],
  );

  const hasFilters = language || industry || difficulty || query.trim();

  function clearFilters() {
    setQuery('');
    setLanguage('');
    setIndustry('');
    setDifficulty('');
  }

  if (samples.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black"></div>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 right-32 w-32 h-32 bg-teal-500 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">Samples Gallery</h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              Explore ready-to-run code samples that show how to build real-world applications with DocumentDB
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-purple-500 via-teal-500 to-blue-500 mx-auto rounded-full"></div>
          </div>
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Samples Coming Soon</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              We're building out our samples gallery. Be the first to contribute a sample and help the community get started with DocumentDB.
            </p>
            <a
              href="https://github.com/documentdb/documentdb-samples-gallery"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500/20 to-teal-500/20 hover:from-purple-500/30 hover:to-teal-500/30 border border-purple-500/30 hover:border-teal-500/40 text-white rounded-xl font-medium transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              Contribute a Sample
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black"></div>
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 right-32 w-32 h-32 bg-teal-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-28 h-28 bg-blue-500 rounded-full blur-2xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
            Samples Gallery
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Explore ready-to-run code samples that show how to build real-world applications with DocumentDB
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-purple-500 via-teal-500 to-blue-500 mx-auto rounded-full"></div>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, language, tag…"
            className="w-full pl-12 pr-4 py-3 bg-neutral-800/80 border border-neutral-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-colors"
          />
        </div>

        {/* Filters; touch screens get 16px selects because iOS zooms into smaller form fields */}
        <div className="flex flex-wrap gap-3 mb-10 justify-center">
          {/* Language */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-neutral-800/80 border border-neutral-700/50 text-gray-300 text-sm pointer-coarse:text-base rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/60 cursor-pointer"
          >
            <option value="">All Languages</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* Industry */}
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="bg-neutral-800/80 border border-neutral-700/50 text-gray-300 text-sm pointer-coarse:text-base rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/60 cursor-pointer"
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>

          {/* Difficulty */}
          <div className="flex flex-wrap justify-center gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(difficulty === d ? '' : d)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 ${
                  difficulty === d
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-neutral-800/80 text-gray-400 border-neutral-700/50 hover:border-neutral-600'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Result count */}
        <p className="text-gray-500 text-sm mb-6 text-center">
          {filtered.length === samples.length
            ? `${samples.length} samples`
            : `${filtered.length} of ${samples.length} samples`}
        </p>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((sample) => (
              <SampleCard key={sample.id} sample={sample} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg font-medium mb-2">No samples found</p>
            <p className="text-gray-600 text-sm mb-6">Try adjusting your search or filters</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-20 text-center">
          <p className="text-gray-400 mb-4">Want to contribute a sample?</p>
          <a
            href="https://github.com/documentdb/documentdb-samples-gallery"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-purple-500/40 text-white rounded-xl font-medium transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
            </svg>
            Open a Pull Request
          </a>
        </div>
      </div>
    </div>
  );
}
