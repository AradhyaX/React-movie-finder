import { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';

// API config
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

// Single movie card
function MovieCard({ movie, onClick, isFavorite, onToggleFavorite }) {
  const hasPoster = movie.Poster && movie.Poster !== 'N/A';
  const type = movie.Type || 'movie';

  return (
    <div className="movie-card" onClick={() => onClick(movie.imdbID || movie.id)}>
      <div className="movie-card-poster">
        <div 
          className={`fav-btn ${isFavorite ? 'active' : ''}`} 
          onClick={(e) => onToggleFavorite(e, movie)}
          title={isFavorite ? "Remove from Watchlist" : "Add to Watchlist"}
        >
          {isFavorite ? '❤️' : '🤍'}
        </div>
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

// Shimmer loading placeholder grid
function Skeleton() {
  return (
    <div className="loading-grid" aria-label="Loading movies">
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

// Movie detail modal — fetches full info by ID
function MovieModal({ id, onClose }) {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchById(id).then(d => { setMovie(d); setLoading(false); });
  }, [id]);

  // Close when clicking outside the modal box
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        {loading || !movie ? (
          <div style={{padding:'60px', textAlign:'center', color:'var(--text-muted)'}}>
            <div style={{fontSize:40, marginBottom:12}}>🎬</div>
            <span>Loading...</span>
          </div>
        ) : (
          <>
            <div className="modal-hero">
              <div className="modal-poster">
                {movie.Poster && movie.Poster !== 'N/A'
                  ? <img src={movie.Poster} alt={movie.Title} />
                  : <div className="poster-placeholder" style={{height:'100%'}}>🎬</div>
                }
              </div>
              <div className="modal-info">
                {movie.Type && (
                  <div className="modal-type-tag">
                    {movie.Type === 'series' ? '📺 TV Series' : movie.Type === 'episode' ? '📼 Episode' : '🎬 Film'}
                  </div>
                )}
                <h2 className="modal-title">{movie.Title}</h2>
                <div className="modal-year-runtime">
                  {movie.Year && <span>📅 {movie.Year}</span>}
                  {movie.Runtime && movie.Runtime !== 'N/A' && (
                    <><div className="dot-sep" /><span>⏱ {movie.Runtime}</span></>
                  )}
                  {movie.Rated && movie.Rated !== 'N/A' && (
                    <><div className="dot-sep" /><span>{movie.Rated}</span></>
                  )}
                </div>
                {movie.imdbRating && movie.imdbRating !== 'N/A' && (
                  <div className="modal-rating">⭐ {movie.imdbRating} <span style={{fontSize:12,fontWeight:400,color:'rgba(251,188,4,0.7)'}}>/ 10</span></div>
                )}
                {movie.Genre && movie.Genre !== 'N/A' && (
                  <div className="modal-genres">
                    {movie.Genre.split(', ').map(g => <div key={g} className="genre-tag">{g}</div>)}
                  </div>
                )}
                {movie.Plot && movie.Plot !== 'N/A' && (
                  <p className="modal-plot">{movie.Plot}</p>
                )}
              </div>
            </div>
            <div className="modal-body">
              {[
                ['Director', movie.Director],
                ['Writers', movie.Writer],
                ['Cast', movie.Actors],
                ['Language', movie.Language],
                ['Country', movie.Country],
                ['Awards', movie.Awards],
                ['Box Office', movie.BoxOffice],
                ['Released', movie.Released],
              ].filter(([, v]) => v && v !== 'N/A').map(([label, value]) => (
                <div key={label} className="modal-detail-group">
                  <div className="modal-detail-label">{label}</div>
                  <div className="modal-detail-value">{value}</div>
                </div>
              ))}
            </div>
          </>
        )}
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
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('cinewave_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [showWatchlist, setShowWatchlist] = useState(false);

  const inputRef = useRef(null);
  const heroInputRef = useRef(null);

  // Load trending on mount
  useEffect(() => {
    fetchTrending().then(d => { setTrending(d); setLoading(false); });
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('cinewave_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Toggle Watchlist favorite
  const toggleFavorite = (e, movie) => {
    e.stopPropagation();
    setFavorites(prev => {
      const isFav = prev.some(f => (f.imdbID || f.id) === (movie.imdbID || movie.id));
      if (isFav) return prev.filter(f => (f.imdbID || f.id) !== (movie.imdbID || movie.id));
      return [...prev, movie];
    });
  };

  // Close modal on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSelectedId(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Run search against OMDB
  const handleSearch = useCallback(async (q = query, f = filter) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearchLoading(true);
    setError('');
    setSearched(true);
    setShowWatchlist(false);
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

  // Reset to home (logo click / clear button)
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setError('');
    setFilter('All');
    setShowWatchlist(false);
  };

  const displayMovies = showWatchlist ? favorites : (searched ? results : trending);
  const sectionTitle = showWatchlist ? 'My Watchlist' : (searched ? `Results for "${query}"` : 'Trending Now');

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo" onClick={handleClear} style={{cursor:'pointer'}} title="Go to Home">
            <div className="logo-icon">🎬</div>
            <div className="logo-text">Cine<span>Wave</span></div>
          </div>

          <div className="search-wrapper">
            <div className="search-input-group">
              <span className="search-icon">🔍</span>
              <input
                ref={inputRef}
                className="search-input"
                type="text"
                placeholder="Search movies, series…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Search movies"
              />
              <button className="search-btn" onClick={() => handleSearch()} id="header-search-btn">
                Search
              </button>
            </div>
          </div>

          <button 
            className={`watchlist-toggle ${showWatchlist ? 'active' : ''}`}
            onClick={() => { setShowWatchlist(!showWatchlist); setSearched(false); setError(''); }}
            title="My Watchlist"
          >
            {favorites.length > 0 && <span className="watchlist-count">{favorites.length}</span>}
            ⭐ Watchlist
          </button>
        </div>
      </header>

      <main className="main">
        {/* Hero — only shown before any search */}
        {!searched && !showWatchlist && (
          <section className="hero">
            <div className="hero-badge">CineWave · Powered by IMDB</div>
            <h1 className="hero-title">
              Find Your Next<br />
              <span className="highlight">Favorite Movie</span>
            </h1>
            <p className="hero-subtitle">
              Search millions of movies, TV series, and more. Instantly.
            </p>
            <div className="hero-search-wrapper">
              <div className="hero-search-input-group">
                <input
                  ref={heroInputRef}
                  className="hero-search-input"
                  type="text"
                  placeholder='Try "Inception", "Breaking Bad"…'
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="Search movies hero"
                  id="hero-search-input"
                />
                <button className="hero-search-btn" onClick={() => handleSearch()} id="hero-search-btn">
                  🔍 Search
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Filter bar — only shown after search */}
        {searched && (
          <div className="filter-bar">
            <span className="filter-label">Filter:</span>
            {FILTERS.map(f => (
              <button
                key={f}
                className={`filter-btn${filter === f ? ' active' : ''}`}
                onClick={() => handleFilterChange(f)}
                id={`filter-${f}`}
              >
                {f === 'All' ? '🎞 All' : f === 'movie' ? '🎬 Movies' : f === 'series' ? '📺 Series' : '📼 Episodes'}
              </button>
            ))}
            <button
              className="filter-btn"
              onClick={handleClear}
              style={{marginLeft:'auto', color:'var(--text-muted)'}}
              id="clear-search-btn"
            >
              ✕ Clear
            </button>
          </div>
        )}

        {/* Section title + result count */}
        <div className="section-header">
          <h2 className="section-title">
            {searched ? '🔎' : '🔥'} {sectionTitle}
            {!loading && !searchLoading && displayMovies.length > 0 && (
              <span className="count">{displayMovies.length} titles</span>
            )}
          </h2>
        </div>

        {/* Movie grid / loading / empty states */}
        {(loading && !searched) || searchLoading ? (
          <Skeleton />
        ) : error ? (
          <div className="state-container">
            <span className="state-icon">😕</span>
            <div className="state-title">{error}</div>
            <div className="state-subtitle">Try a different keyword or check your spelling.</div>
          </div>
        ) : displayMovies.length === 0 ? (
          <div className="state-container">
            <span className="state-icon">{showWatchlist ? '📭' : '🍿'}</span>
            <div className="state-title">{showWatchlist ? 'Your Watchlist is empty' : 'Type something to search'}</div>
            <div className="state-subtitle">{showWatchlist ? 'Add movies you want to watch later by clicking the heart icon on any poster.' : 'Start typing in the search bar to discover movies and TV shows.'}</div>
          </div>
        ) : (
          <div className="movie-grid">
            {displayMovies.map(m => (
              <MovieCard
                key={m.imdbID || m.Title}
                movie={m}
                onClick={setSelectedId}
                isFavorite={favorites.some(f => (f.imdbID || f.id) === (m.imdbID || m.id))}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </main>

      {/* Movie detail modal */}
      {selectedId && (
        <MovieModal id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
