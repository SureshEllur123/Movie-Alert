import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Calendar,
  Clock,
  MapPin,
  Film,
  Building,
  Bell,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Sparkles,
  Link,
  Loader2,
} from 'lucide-react';
import {
  Tracker,
  BookingPlatform,
  TimeFilterType,
  AlertPreferences,
  MovieSearchResult,
} from '../../types/index.ts';
import {
  KNOWN_MOVIES,
  KNOWN_THEATRES,
  POPULAR_CITIES,
  THEATRE_CHAINS,
  AVAILABLE_LANGUAGES,
} from '../../services/providers/cinemaData.ts';
import { db } from '../../services/database/storage.ts';

interface CreateTrackerModalProps {
  onClose: () => void;
  onTrackerCreated: (tracker: Tracker) => void;
}

export const CreateTrackerModal: React.FC<CreateTrackerModalProps> = ({
  onClose,
  onTrackerCreated,
}) => {
  const [step, setStep] = useState<number>(1);

  // Form State
  const [movieSearch, setMovieSearch] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<{
    title: string;
    posterUrl: string;
    isUpcoming?: boolean;
  } | null>(null);

  // Live Web Search State
  const [liveMovies, setLiveMovies] = useState<MovieSearchResult[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [directUrl, setDirectUrl] = useState('');

  // Dates
  const [selectedDates, setSelectedDates] = useState<string[]>(() => {
    const today = new Date().toISOString().split('T')[0];
    return [today];
  });
  const [dateInput, setDateInput] = useState<string>('');

  // Location & Theatres
  const [selectedCity, setSelectedCity] = useState<string>('Hyderabad');
  const [customCity, setCustomCity] = useState<string>('');
  const [theatreMode, setTheatreMode] = useState<'all' | 'custom'>('all');
  const [selectedTheatres, setSelectedTheatres] = useState<string[]>([]);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [theatreQuery, setTheatreQuery] = useState<string>('');

  // Time & Language
  const [timeFilterType, setTimeFilterType] = useState<TimeFilterType>('any');
  const [customStartTime, setCustomStartTime] = useState('18:00');
  const [customEndTime, setCustomEndTime] = useState('23:00');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('any');

  // Platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState<BookingPlatform[]>([
    'BookMyShow',
    'District',
  ]);

  // Alert preferences
  const [alertPreferences, setAlertPreferences] = useState<AlertPreferences>({
    newShowReleased: true,
    seatsBecomeBookable: true,
    newDatesAvailable: true,
    crossPlatformShow: true,
  });

  // Frequency
  const [intervalMinutes, setIntervalMinutes] = useState<15 | 30 | 60 | 0>(15);

  const cityToUse = customCity.trim() || selectedCity;

  // Debounced live dynamic movie search across web / BMS / District
  useEffect(() => {
    const q = movieSearch.trim();
    if (!q || q.length < 2) {
      setLiveMovies([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLive(true);
      try {
        const res = await fetch('/api/movies/live-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, city: cityToUse }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.movies && data.movies.length > 0) {
            setLiveMovies(data.movies);
          }
        }
      } catch {
        // Fallback
      } finally {
        setIsSearchingLive(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [movieSearch, cityToUse]);

  // Combine live web results with local known blockbusters
  const localFiltered = KNOWN_MOVIES.filter((m) =>
    m.title.toLowerCase().includes(movieSearch.toLowerCase())
  );
  const titlesSeen = new Set<string>();
  const combinedMovies: MovieSearchResult[] = [];

  [...liveMovies, ...localFiltered].forEach((m) => {
    const key = m.title.toLowerCase().trim();
    if (!titlesSeen.has(key)) {
      titlesSeen.add(key);
      combinedMovies.push(m);
    }
  });
  const availableTheatres = KNOWN_THEATRES[cityToUse] || KNOWN_THEATRES['Hyderabad'] || [];
  const filteredTheatres = availableTheatres.filter((t) =>
    t.name.toLowerCase().includes(theatreQuery.toLowerCase())
  );

  const toggleDate = (dateStr: string) => {
    if (selectedDates.includes(dateStr)) {
      if (selectedDates.length > 1) {
        setSelectedDates(selectedDates.filter((d) => d !== dateStr));
      }
    } else {
      setSelectedDates([...selectedDates, dateStr].sort());
    }
  };

  const handleAddCustomDate = () => {
    if (!dateInput) return;
    if (!selectedDates.includes(dateInput)) {
      setSelectedDates([...selectedDates, dateInput].sort());
    }
    setDateInput('');
  };

  const togglePlatform = (p: BookingPlatform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const toggleTheatre = (name: string) => {
    if (selectedTheatres.includes(name)) {
      setSelectedTheatres(selectedTheatres.filter((t) => t !== name));
    } else {
      setSelectedTheatres([...selectedTheatres, name]);
    }
  };

  const toggleChain = (chain: string) => {
    if (selectedChains.includes(chain)) {
      setSelectedChains(selectedChains.filter((c) => c !== chain));
    } else {
      setSelectedChains([...selectedChains, chain]);
    }
  };

  const handleSubmit = () => {
    const movieName = selectedMovie ? selectedMovie.title : movieSearch.trim();
    if (!movieName) return;

    const newTracker: Tracker = {
      id: `tracker_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      movieName,
      movieIdentifier: movieName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      posterUrl:
        selectedMovie?.posterUrl ||
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
      directUrl: directUrl.trim() || undefined,
      selectedDates,
      timeFilter: {
        type: timeFilterType,
        customStart: timeFilterType === 'custom' ? customStartTime : undefined,
        customEnd: timeFilterType === 'custom' ? customEndTime : undefined,
      },
      language: selectedLanguage,
      city: cityToUse,
      theatres: theatreMode === 'all' ? [] : selectedTheatres,
      theatreChains: theatreMode === 'all' ? [] : selectedChains,
      platforms: selectedPlatforms,
      alertPreferences,
      monitoringIntervalMinutes: intervalMinutes,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastCheckedAt: Date.now(),
      discoveredShowsCount: 0,
      newSeatsAlertsCount: 0,
    };

    db.addTracker(newTracker);
    onTrackerCreated(newTracker);
    onClose();
  };

  // Preset dates helper: Today, Tomorrow, Weekend
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#10141B] border border-[#252D38] rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Step Indicator Header */}
        <div className="p-4 border-b border-[#252D38] flex items-center justify-between bg-[#151A22]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#B7F36B] text-[#090B0F] font-bold text-xs flex items-center justify-center font-mono">
              {step}
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#F4F6FA]">
                {step === 1 && 'Select Movie & Dates'}
                {step === 2 && 'Location, Theatres & Platform'}
                {step === 3 && 'Alert Rules & Frequency'}
                {step === 4 && 'Confirm Cinema Radar'}
              </h3>
              <p className="text-[11px] text-[#929BAA]">Step {step} of 4</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1C232E] border border-[#252D38] flex items-center justify-center text-[#929BAA] hover:text-[#F4F6FA]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: MOVIE & DATES */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Movie Search & Select */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#929BAA] block mb-2">
                  Movie Name <span className="text-[#B7F36B]">*</span>
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[#626D7D]" />
                  <input
                    type="text"
                    value={movieSearch}
                    onChange={(e) => {
                      setMovieSearch(e.target.value);
                      if (selectedMovie && selectedMovie.title !== e.target.value) {
                        setSelectedMovie(null);
                      }
                    }}
                    placeholder="Search movie or enter custom name (e.g. Ramayana, Kalki)..."
                    className="w-full bg-[#151A22] border border-[#252D38] focus:border-[#B7F36B] rounded-xl pl-9 pr-8 py-2.5 text-sm text-[#F4F6FA] placeholder-[#626D7D] focus:outline-none transition-all"
                  />
                  {isSearchingLive && (
                    <Loader2 className="w-4 h-4 absolute right-3 top-3 text-[#B7F36B] animate-spin" />
                  )}
                </div>

                {/* Autocomplete / Suggested list */}
                {combinedMovies.length > 0 && !selectedMovie && (
                  <div className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#626D7D] mb-1">
                      <span>{isSearchingLive ? 'Searching live cinema radar...' : 'Live Matching Movies:'}</span>
                      <span className="text-[10px] text-[#B7F36B]">Live Dynamic</span>
                    </div>
                    {combinedMovies.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMovie({
                            title: m.title,
                            posterUrl: m.posterUrl,
                            isUpcoming: m.isUpcoming,
                          });
                          setMovieSearch(m.title);
                        }}
                        className="w-full p-2 rounded-xl bg-[#151A22] hover:bg-[#1C232E] border border-[#252D38] flex items-center gap-3 text-left transition-all group"
                      >
                        <img
                          src={m.posterUrl}
                          alt={m.title}
                          className="w-8 h-11 object-cover rounded-md shrink-0 bg-[#090B0F]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#F4F6FA] truncate group-hover:text-[#B7F36B]">
                              {m.title}
                            </h4>
                            {m.isUpcoming && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#B7F36B]/20 text-[#B7F36B]">
                                UPCOMING
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#929BAA] truncate">
                            {m.languages?.join(', ')} • {m.formats?.join(', ')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Movie Preview */}
                {selectedMovie && (
                  <div className="mt-3 p-3 rounded-xl bg-[#151A22] border border-[#B7F36B]/40 flex items-center gap-3">
                    <img
                      src={selectedMovie.posterUrl}
                      alt={selectedMovie.title}
                      className="w-10 h-14 object-cover rounded-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono text-[#B7F36B] block">Selected Movie</span>
                      <h4 className="text-sm font-bold text-[#F4F6FA] truncate">
                        {selectedMovie.title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMovie(null);
                        setMovieSearch('');
                      }}
                      className="text-[#626D7D] hover:text-[#F4F6FA] text-xs p-1"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Optional Direct Booking URL */}
                <div className="mt-3 pt-3 border-t border-[#252D38]/60">
                  <label className="text-xs font-semibold text-[#929BAA] flex items-center gap-1.5 mb-1.5">
                    <Link className="w-3.5 h-3.5 text-[#B7F36B]" />
                    <span>Direct BookMyShow or District Link (Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={directUrl}
                    onChange={(e) => setDirectUrl(e.target.value)}
                    placeholder="e.g. https://in.bookmyshow.com/buytickets/movie-name/... or https://district.in/events/..."
                    className="w-full bg-[#151A22] border border-[#252D38] focus:border-[#B7F36B] rounded-xl px-3 py-2 text-xs text-[#F4F6FA] placeholder-[#626D7D] focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-[#626D7D] mt-1">
                    Have a specific show page or event link? Cinema Alert will monitor this exact live URL directly.
                  </p>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#929BAA]">
                    Target Dates <span className="text-[#B7F36B]">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#626D7D]">
                    {selectedDates.length} selected
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => toggleDate(formatDate(today))}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      selectedDates.includes(formatDate(today))
                        ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B] font-bold'
                        : 'bg-[#151A22] text-[#929BAA] border-[#252D38]'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDate(formatDate(tomorrow))}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      selectedDates.includes(formatDate(tomorrow))
                        ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B] font-bold'
                        : 'bg-[#151A22] text-[#929BAA] border-[#252D38]'
                    }`}
                  >
                    Tomorrow
                  </button>
                </div>

                {/* Selected Date Chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedDates.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1C232E] border border-[#252D38] text-xs text-[#F4F6FA] font-mono"
                    >
                      <Calendar className="w-3 h-3 text-[#B7F36B]" />
                      <span>{d}</span>
                      {selectedDates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => toggleDate(d)}
                          className="hover:text-[#F07878] ml-1"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {/* Add Custom Date input */}
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateInput}
                    min={formatDate(today)}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="flex-1 bg-[#151A22] border border-[#252D38] focus:border-[#B7F36B] rounded-xl px-3 py-2 text-xs text-[#F4F6FA] focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDate}
                    disabled={!dateInput}
                    className="px-3 py-2 rounded-xl bg-[#1C232E] hover:bg-[#252D38] border border-[#252D38] text-xs font-medium text-[#F4F6FA] disabled:opacity-40"
                  >
                    + Add Date
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION, THEATRES & PLATFORMS */}
          {step === 2 && (
            <div className="space-y-5">
              {/* City Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#929BAA] block mb-2">
                  City / Location
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {POPULAR_CITIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedCity(c);
                        setCustomCity('');
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        selectedCity === c && !customCity
                          ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B] font-bold'
                          : 'bg-[#151A22] text-[#929BAA] border-[#252D38]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="Or enter custom city (no GPS permission required)..."
                  className="w-full bg-[#151A22] border border-[#252D38] focus:border-[#B7F36B] rounded-xl px-3.5 py-2 text-xs text-[#F4F6FA] placeholder-[#626D7D] focus:outline-none"
                />
              </div>

              {/* Booking Platforms */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#929BAA] block mb-2">
                  Booking Platforms <span className="text-[#B7F36B]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => togglePlatform('BookMyShow')}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      selectedPlatforms.includes('BookMyShow')
                        ? 'bg-[#1C232E] border-[#B7F36B] text-[#F4F6FA]'
                        : 'bg-[#151A22] border-[#252D38] text-[#626D7D]'
                    }`}
                  >
                    <div className="text-left">
                      <h4 className="text-xs font-bold">BookMyShow</h4>
                      <p className="text-[10px] text-[#929BAA]">PVR, INOX, Allu, AMB</p>
                    </div>
                    {selectedPlatforms.includes('BookMyShow') && (
                      <Check className="w-4 h-4 text-[#B7F36B]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePlatform('District')}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      selectedPlatforms.includes('District')
                        ? 'bg-[#1C232E] border-[#B7F36B] text-[#F4F6FA]'
                        : 'bg-[#151A22] border-[#252D38] text-[#626D7D]'
                    }`}
                  >
                    <div className="text-left">
                      <h4 className="text-xs font-bold">District</h4>
                      <p className="text-[10px] text-[#929BAA]">Zomato Cinema</p>
                    </div>
                    {selectedPlatforms.includes('District') && (
                      <Check className="w-4 h-4 text-[#B7F36B]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Theatres filter */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#929BAA] block mb-2">
                  Theatres to Monitor
                </label>
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setTheatreMode('all')}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      theatreMode === 'all'
                        ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B]'
                        : 'bg-[#151A22] text-[#929BAA] border-[#252D38]'
                    }`}
                  >
                    All Theatres in {cityToUse}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheatreMode('custom')}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      theatreMode === 'custom'
                        ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B]'
                        : 'bg-[#151A22] text-[#929BAA] border-[#252D38]'
                    }`}
                  >
                    Select Specific Theatres
                  </button>
                </div>

                {theatreMode === 'custom' && (
                  <div className="space-y-3 p-3 rounded-xl bg-[#151A22] border border-[#252D38]">
                    {/* Chain filters */}
                    <div>
                      <span className="text-[11px] text-[#626D7D] font-mono block mb-1.5">
                        Filter by Multiplex Chains:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {THEATRE_CHAINS.slice(0, 6).map((chain) => (
                          <button
                            key={chain}
                            type="button"
                            onClick={() => toggleChain(chain)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                              selectedChains.includes(chain)
                                ? 'bg-[#1C232E] border-[#B7F36B] text-[#B7F36B]'
                                : 'bg-[#10141B] border-[#252D38] text-[#929BAA]'
                            }`}
                          >
                            {chain}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Specific Theatres */}
                    <div>
                      <input
                        type="text"
                        value={theatreQuery}
                        onChange={(e) => setTheatreQuery(e.target.value)}
                        placeholder={`Search theatres in ${cityToUse}...`}
                        className="w-full bg-[#10141B] border border-[#252D38] focus:border-[#B7F36B] rounded-lg px-3 py-1.5 text-xs text-[#F4F6FA] mb-2 focus:outline-none"
                      />
                      <div className="max-h-36 overflow-y-auto space-y-1">
                        {filteredTheatres.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleTheatre(t.name)}
                            className={`w-full p-2 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                              selectedTheatres.includes(t.name)
                                ? 'bg-[#1C232E] border-[#B7F36B] text-[#F4F6FA]'
                                : 'bg-[#10141B] border-[#252D38] text-[#929BAA]'
                            }`}
                          >
                            <span className="truncate">{t.name}</span>
                            {selectedTheatres.includes(t.name) && (
                              <Check className="w-3.5 h-3.5 text-[#B7F36B] shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: TIME, LANGUAGE & ALERTS */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Showtime Slot */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#929BAA] block mb-2">
                  Showtime Window (Optional)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {(['any', 'morning', 'afternoon', 'evening', 'night', 'custom'] as TimeFilterType[]).map(
                    (slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTimeFilterType(slot)}
                        className={`py-2 px-2 rounded-xl border text-xs font-semibold capitalize transition-all ${
                          timeFilterType === slot
                            ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B]'
                            : 'bg-[#151A22] text-[#929BAA] border-[#252D38]'
                        }`}
                      >
                        {slot === 'any' ? 'Any Time' : slot}
                      </button>
                    )
                  )}
                </div>

                {timeFilterType === 'custom' && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#151A22] border border-[#252D38]">
                    <div className="flex-1">
                      <span className="text-[10px] text-[#626D7D] block mb-1">From</span>
                      <input
                        type="time"
                        value={customStartTime}
                        onChange={(e) => setCustomStartTime(e.target.value)}
                        className="w-full bg-[#10141B] border border-[#252D38] rounded-lg p-2 text-xs text-[#F4F6FA]"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-[#626D7D] block mb-1">To (midnight supported)</span>
                      <input
                        type="time"
                        value={customEndTime}
                        onChange={(e) => setCustomEndTime(e.target.value)}
                        className="w-full bg-[#10141B] border border-[#252D38] rounded-lg p-2 text-xs text-[#F4F6FA]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Language Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#929BAA] block mb-2">
                  Language Filter (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedLanguage('any')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      selectedLanguage === 'any'
                        ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B] font-bold'
                        : 'bg-[#151A22] text-[#929BAA] border-[#252D38]'
                    }`}
                  >
                    Any Language
                  </button>
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        selectedLanguage === lang
                          ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B] font-bold'
                          : 'bg-[#151A22] text-[#929BAA] border-[#252D38]'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alert Preferences */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#929BAA] block mb-2">
                  Alert Triggers
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#151A22] border border-[#252D38] cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-[#F4F6FA] block">
                        New Show Released
                      </span>
                      <span className="text-[11px] text-[#929BAA]">
                        Notify instantly when bookings open on BookMyShow or District.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertPreferences.newShowReleased}
                      onChange={(e) =>
                        setAlertPreferences({ ...alertPreferences, newShowReleased: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#B7F36B]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#151A22] border border-[#252D38] cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-[#F4F6FA] block">
                        Previously Unavailable Seats Reopened
                      </span>
                      <span className="text-[11px] text-[#929BAA]">
                        Detects when held, blocked, or cancelled tickets become bookable again.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertPreferences.seatsBecomeBookable}
                      onChange={(e) =>
                        setAlertPreferences({ ...alertPreferences, seatsBecomeBookable: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#B7F36B]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#151A22] border border-[#252D38] cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-[#F4F6FA] block">
                        New Booking Dates Added
                      </span>
                      <span className="text-[11px] text-[#929BAA]">
                        Alert when the theatre extends bookings to upcoming dates.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertPreferences.newDatesAvailable}
                      onChange={(e) =>
                        setAlertPreferences({ ...alertPreferences, newDatesAvailable: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#B7F36B]"
                    />
                  </label>
                </div>
              </div>

              {/* Monitoring Frequency */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#929BAA] block mb-2">
                  Monitoring Frequency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {[15, 30, 60, 0].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setIntervalMinutes(mins as 15 | 30 | 60 | 0)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                        intervalMinutes === mins
                          ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B]'
                          : 'bg-[#151A22] text-[#929BAA] border-[#252D38]'
                      }`}
                    >
                      {mins === 0 ? 'Foreground' : `${mins} Mins`}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#626D7D] leading-relaxed">
                  {intervalMinutes === 0
                    ? 'Continuous foreground mode runs frequent 45-second checks with ongoing notification.'
                    : `Standard Android WorkManager executes periodic background sync every ${intervalMinutes} minutes.`}
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRMATION SUMMARY */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#151A22] border border-[#B7F36B]/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#B7F36B] uppercase font-mono">
                  <Sparkles className="w-4 h-4" />
                  <span>Cinema Radar Summary</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-[#252D38]/60 pb-1.5">
                    <span className="text-[#929BAA]">Movie:</span>
                    <span className="font-bold text-[#F4F6FA]">
                      {selectedMovie?.title || movieSearch}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#252D38]/60 pb-1.5">
                    <span className="text-[#929BAA]">Location:</span>
                    <span className="font-semibold text-[#F4F6FA]">{cityToUse}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#252D38]/60 pb-1.5">
                    <span className="text-[#929BAA]">Dates ({selectedDates.length}):</span>
                    <span className="font-mono text-[#F4F6FA] text-right truncate max-w-[200px]">
                      {selectedDates.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#252D38]/60 pb-1.5">
                    <span className="text-[#929BAA]">Time Slot:</span>
                    <span className="font-semibold text-[#F4F6FA] capitalize">
                      {timeFilterType}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#252D38]/60 pb-1.5">
                    <span className="text-[#929BAA]">Language:</span>
                    <span className="font-semibold text-[#F4F6FA]">{selectedLanguage}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#252D38]/60 pb-1.5">
                    <span className="text-[#929BAA]">Theatres:</span>
                    <span className="font-semibold text-[#F4F6FA] text-right">
                      {theatreMode === 'all'
                        ? `All in ${cityToUse}`
                        : `${selectedTheatres.length} specific + ${selectedChains.length} chains`}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#252D38]/60 pb-1.5">
                    <span className="text-[#929BAA]">Platforms:</span>
                    <span className="font-semibold text-[#B7F36B]">
                      {selectedPlatforms.join(' & ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#929BAA]">Monitoring Cycle:</span>
                    <span className="font-mono text-[#F4F6FA]">
                      {intervalMinutes === 0 ? 'Continuous Foreground' : `Every ${intervalMinutes} mins`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#151A22] border border-[#252D38] flex items-start gap-2 text-xs text-[#929BAA]">
                <AlertCircle className="w-4 h-4 text-[#B7F36B] shrink-0 mt-0.5" />
                <p>
                  Zero cloud costs. This radar stores all parameters locally in SQLite and checks BookMyShow & District using your connection.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[#252D38] bg-[#090B0F] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#151A22] border border-[#252D38] text-xs font-semibold text-[#F4F6FA] hover:bg-[#1C232E]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#151A22] border border-[#252D38] text-xs font-semibold text-[#626D7D] hover:text-[#F4F6FA]"
            >
              Cancel
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              disabled={step === 1 && !movieSearch && !selectedMovie}
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 px-5 py-2 rounded-xl bg-[#B7F36B] hover:bg-[#a6e655] text-[#090B0F] text-xs font-bold disabled:opacity-40 active:scale-95 transition-all"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1 px-6 py-2 rounded-xl bg-[#B7F36B] hover:bg-[#a6e655] text-[#090B0F] text-xs font-bold active:scale-95 transition-all shadow-lg shadow-[#B7F36B]/20"
            >
              <Check className="w-4 h-4" />
              <span>Activate Cinema Radar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
