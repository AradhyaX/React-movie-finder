import { useState, useEffect, useCallback } from 'react';
import './index.css';

const API_KEY = 'trilogy';
const BASE_URL = 'https://www.omdbapi.com/';

// Hardcoded trending movie IDs
const TRENDING_IDS = [
  'tt9362722','tt1877830','tt15398776','tt10366460',
  'tt1745960','tt4154796','tt0499549','tt6791350',
  'tt7286456','tt0816692','tt0120737','tt0145487',
];

const FILTERS = ['All', 'movie', 'series', 'episode'];

// Search movies by keyword
async function fetchBySearch(q, type) {
  const t = type && type !== 'All' ? `&type=${type}` : '';
  const r = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(q)}&plot=short${t}`);
  const d = await r.json();
  return d.Search || [];
}

// Get full movie details by IMDB ID
async function fetchById(id) {
  const r = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${id}&plot=full`);
  return r.json();
}

// Fetch all trending movies in parallel
async function fetchTrending() {
  const results = await Promise.allSettled(TRENDING_IDS.map(id => fetchById(id)));
  return results
    .filter(r => r.status === 'fulfilled' && r.value.Response === 'True')
    .map(r => r.value);
}

// Shimmer loading placeholder grid
function Skeleton() {
  return (
    <div className="loading-grid">
      {Array.from({length: 12}).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-poster" />
          <div className="skeleton-info">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Single movie card
function MovieCard({ movie, onClick }) {
  const hasPoster = movie.Poster && movie.Poster !== 'N/A';
  const type = movie.Type || 'movie';

  return (
    <div className="movie-card" onClick={() => onClick(movie.imdbID)}>
      <div className="movie-card-poster">
        {hasPoster ? (
          <img src={movie.Poster} alt={movie.Title} loading="lazy" />
        ) : (
          <div className="poster-placeholder">🎬<span>{movie.Title}</span></div>
        )}
        <div className="poster-overlay"><div className="play-btn">▶</div></div>
        {movie.Year && <div className="movie-year-badge">{movie.Year?.replace(/–.*/, '')}</div>}
        {type && type !== 'N/A' && (
          <div className="movie-type-badge">{type === 'series' ? 'TV' : type === 'episode' ? 'Ep' : 'Film'}</div>
        )}
      </div>
      <div className="movie-card-info">
        <div className="movie-card-title">{movie.Title}</div>
        <div className="movie-card-meta">
          {movie.imdbRating && movie.imdbRating !== 'N/A'
            ? <><span>⭐</span>{movie.imdbRating}</>
            : <span style={{color:'var(--text-muted)'}}>No rating</span>
          }
        </div>
      </div>
    </div>
  );
}

// Main app
export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [searched, setSearched] = useState(false);

  // Load trending on mount
  useEffect(() => {
    fetchTrending().then(d => { setTrending(d); setLoading(false); });
  }, []);

  // Run search against OMDB
  const handleSearch = useCallback(async (q = query, f = filter) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearchLoading(true);
    setError('');
    setSearched(true);
    try {
      const data = await fetchBySearch(trimmed, f);
      setResults(data);
      if (data.length === 0) setError(`No results found for "${trimmed}"`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  }, [query, filter]);

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  // Change filter and re-run search if active
  const handleFilterChange = (f) => {
    setFilter(f);
    if (searched && query.trim()) handleSearch(query, f);
  };

  // Reset to home
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setError('');
    setFilter('All');
  };

  const displayMovies = searched ? results : trending;
  const sectionTitle = searched ? `Results for "${query}"` : 'Trending Now';

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo" onClick={handleClear} style={{cursor:'pointer'}}>
            <div className="logo-icon">🎬</div>
            <div className="logo-text">Movie<span>Finder</span></div>
          </div>
          <div className="search-wrapper">
            <div className="search-input-group">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search movies, series…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="search-btn" onClick={() => handleSearch()} id="header-search-btn">Search</button>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        {!searched && (
          <section className="hero">
            <div className="hero-badge">Powered by OMDB</div>
            <h1 className="hero-title">Find Your Next<br /><span className="highlight">Favorite Movie</span></h1>
            <p className="hero-subtitle">Search millions of movies, TV series, and more. Instantly.</p>
            <div className="hero-search-wrapper">
              <div className="hero-search-input-group">
                <input
                  className="hero-search-input"
                  type="text"
                  placeholder='Try "Inception", "Breaking Bad"…'
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  id="hero-search-input"
                />
                <button className="hero-search-btn" onClick={() => handleSearch()} id="hero-search-btn">🔍 Search</button>
              </div>
            </div>
          </section>
        )}

        {searched && (
          <div className="filter-bar">
            <span className="filter-label">Filter:</span>
            {FILTERS.map(f => (
              <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => handleFilterChange(f)}>
                {f === 'All' ? '🎞 All' : f === 'movie' ? '🎬 Movies' : f === 'series' ? '📺 Series' : '📼 Episodes'}
              </button>
            ))}
            <button className="filter-btn" onClick={handleClear} style={{marginLeft:'auto'}} id="clear-search-btn">✕ Clear</button>
          </div>
        )}

        <div className="section-header">
          <h2 className="section-title">
            {searched ? '🔎' : '🔥'} {sectionTitle}
            {!loading && !searchLoading && displayMovies.length > 0 && (
              <span className="count">{displayMovies.length} titles</span>
            )}
          </h2>
        </div>

        {(loading && !searched) || searchLoading ? (
          <Skeleton />
        ) : error ? (
          <div className="state-container">
            <span className="state-icon">😕</span>
            <div className="state-title">{error}</div>
            <div className="state-subtitle">Try a different keyword or check your spelling.</div>
          </div>
        ) : (
          <div className="movie-grid">
            {displayMovies.map(m => (
              <MovieCard key={m.imdbID || m.Title} movie={m} onClick={setSelectedId} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
