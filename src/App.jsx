import { useState } from 'react';
import './index.css';

const API_KEY = 'trilogy';
const BASE_URL = 'https://www.omdbapi.com/';

const FILTERS = ['All', 'movie', 'series', 'episode'];

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
          <div className="poster-placeholder">
            🎬
            <span>{movie.Title}</span>
          </div>
        )}
        <div className="poster-overlay">
          <div className="play-btn">▶</div>
        </div>
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

// Main app — search only, no trending yet
export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const t = filter !== 'All' ? `&type=${filter}` : '';
      const r = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(trimmed)}${t}`);
      const d = await r.json();
      setResults(d.Search || []);
      if (!d.Search) setError(`No results found for "${trimmed}"`);
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
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
              <button className="search-btn" onClick={handleSearch} id="header-search-btn">
                Search
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="hero">
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
              <button className="hero-search-btn" onClick={handleSearch} id="hero-search-btn">
                🔍 Search
              </button>
            </div>
          </div>
        </section>

        {searched && (
          <div className="filter-bar">
            <span className="filter-label">Filter:</span>
            {FILTERS.map(f => (
              <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'All' ? '🎞 All' : f === 'movie' ? '🎬 Movies' : f === 'series' ? '📺 Series' : '📼 Episodes'}
              </button>
            ))}
          </div>
        )}

        {loading && <p style={{textAlign:'center', color:'var(--text-muted)', padding:'40px'}}>Loading...</p>}
        {error && <div className="state-container"><span className="state-icon">😕</span><div className="state-title">{error}</div></div>}

        {results.length > 0 && (
          <div className="movie-grid">
            {results.map(m => <MovieCard key={m.imdbID} movie={m} onClick={() => {}} />)}
          </div>
        )}
      </main>
    </div>
  );
}
