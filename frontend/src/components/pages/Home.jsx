import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Moon,
  PawPrint,
  Search,
  ShieldCheck,
  Sun,
  Syringe,
  Home as HomeIcon,
  Send,
  ArrowRight,
} from 'lucide-react'
import apiClient, { SERVER_URL } from '../../services/api'
import { useTheme } from '../../hooks/useTheme'

const speciesEmojiMap = {
  dog: '🐕',
  cat: '🐈',
  bird: '🦜',
  rabbit: '🐰',
  fish: '🐟',
  hamster: '🐹',
  turtle: '🐢',
  snake: '🐍',
}

const getEmoji = (species) => speciesEmojiMap[String(species || '').toLowerCase()] || '🐾'

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http')) return imageUrl
  return `${SERVER_URL}${imageUrl}`
}

const AGE_STORAGE_OFFSET = 10000

const decodeAgeToMonths = (rawAge) => {
  if (rawAge === null || rawAge === undefined || rawAge === '') return null

  const numericAge = Number(rawAge)
  if (!Number.isFinite(numericAge)) return null

  if (numericAge >= AGE_STORAGE_OFFSET) {
    return numericAge - AGE_STORAGE_OFFSET
  }

  return numericAge * 12
}

const formatAgeLabel = (rawAge) => {
  const totalMonths = decodeAgeToMonths(rawAge)
  if (totalMonths === null || totalMonths <= 0) return 'Unknown age'

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  if (years === 0) {
    return `${months} month${months === 1 ? '' : 's'}`
  }

  if (months === 0) {
    return `${years} year${years === 1 ? '' : 's'}`
  }

  return `${years} year${years === 1 ? '' : 's'} ${months} month${months === 1 ? '' : 's'}`
}

import catImage1 from '../../assets/images/1.jpg'
import catImage2 from '../../assets/images/2.jpeg'
import catImage3 from '../../assets/images/3.jpg'
import catImage4 from '../../assets/images/4.jpg'

const HERO_SLIDES = [
  {
    src: catImage1,
    alt: 'Cat resting on a cozy blanket',
  },
  {
    src: catImage2,
    alt: 'Curious cat looking toward the camera',
  },
  {
    src: catImage3,
    alt: 'Playful cat portrait',
  },
  {
    src: catImage4,
    alt: 'Cat ready for adoption',
  },
]

export default function Home() {
  const { isDark, toggleTheme } = useTheme()
  const [pets, setPets] = useState([])
  const [strayReports, setStrayReports] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [selectedSpecies, setSelectedSpecies] = useState('all')
  const [selectedAge, setSelectedAge] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [strayReportsLoading, setStrayReportsLoading] = useState(true)
  const [strayReportsError, setStrayReportsError] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [favoritePetIds, setFavoritePetIds] = useState([])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 4000)

    return () => clearInterval(intervalId)
  }, [])

  const goToPreviousSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
  }

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  useEffect(() => {
    const loadPets = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await apiClient.get('/v1/pets')
        const allPets = Array.isArray(response.data) ? response.data : []
        const availablePets = allPets.filter((pet) => String(pet?.status || '').toLowerCase() === 'available')
        setPets(availablePets.slice(0, 6))
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load pets')
        setPets([])
      } finally {
        setLoading(false)
      }
    }

    loadPets()
  }, [])

  useEffect(() => {
    const loadStrayReports = async () => {
      try {
        setStrayReportsLoading(true)
        setStrayReportsError('')
        const response = await apiClient.get('/v1/stray-reports/public?limit=3')
        setStrayReports(Array.isArray(response.data) ? response.data : [])
      } catch (err) {
        setStrayReportsError(err.response?.data?.detail || 'Failed to load stray reports')
        setStrayReports([])
      } finally {
        setStrayReportsLoading(false)
      }
    }

    loadStrayReports()
  }, [])

  const filteredPets = useMemo(() => {
    const query = searchQuery.toLowerCase()
    const location = locationQuery.toLowerCase()

    return pets.filter((pet) => {
      const name = String(pet.name || '').toLowerCase()
      const breed = String(pet.breed || '').toLowerCase()
      const species = String(pet.species || '').toLowerCase()
      const petLocation = String(pet.location || pet.city || pet.address || '').toLowerCase()
      const totalMonths = decodeAgeToMonths(pet.age)

      const searchMatch = !query || name.includes(query) || breed.includes(query) || species.includes(query)
      const locationMatch = !location || petLocation.includes(location)
      const speciesMatch = selectedSpecies === 'all' || species === selectedSpecies
      const ageMatch = selectedAge === 'all'
        || (totalMonths !== null && selectedAge === 'young' && totalMonths > 0 && totalMonths <= 24)
        || (totalMonths !== null && selectedAge === 'adult' && totalMonths > 24 && totalMonths <= 96)
        || (totalMonths !== null && selectedAge === 'senior' && totalMonths > 96)

      return searchMatch && locationMatch && speciesMatch && ageMatch
    })
  }, [pets, searchQuery, locationQuery, selectedSpecies, selectedAge])

  const featuredSpecies = useMemo(() => {
    const species = new Set(
      pets
        .map((pet) => String(pet.species || '').toLowerCase())
        .filter(Boolean),
    )
    return ['all', ...species]
  }, [pets])

  const toggleFavorite = (petId) => {
    setFavoritePetIds((prev) => {
      if (prev.includes(petId)) {
        return prev.filter((id) => id !== petId)
      }
      return [...prev, petId]
    })
  }

  const formatLocation = (pet) => {
    return pet.location || pet.city || pet.address || 'Nearby shelter'
  }

  const isVaccinated = (pet) => {
    return Boolean(pet.vaccinated ?? pet.is_vaccinated)
  }

  const getStrayStatusBadge = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'resolved') {
      return {
        label: 'Resolved',
        className: 'bg-emerald-500/25 text-emerald-100',
      }
    }

    if (normalized === 'in_progress') {
      return {
        label: 'In Progress',
        className: 'bg-amber-400/20 text-amber-100',
      }
    }

    return {
      label: 'Needs Help',
      className: 'bg-red-500/25 text-red-100',
    }
  }

  const formatRelativeTime = (value) => {
    if (!value) return 'Recently reported'

    const timestamp = new Date(value).getTime()
    if (Number.isNaN(timestamp)) return 'Recently reported'

    const diffMinutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000))
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <section className="relative overflow-hidden px-4 pb-20 pt-14 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-36 top-0 h-[32rem] w-[32rem] rounded-full bg-[rgba(167,139,250,0.2)] blur-[120px]" />
          <div className="absolute -right-36 bottom-0 h-[30rem] w-[30rem] rounded-full bg-[rgba(56,189,248,0.15)] blur-[120px]" />
        </div>

        <div className="relative mx-auto mb-6 flex max-w-7xl items-center justify-end gap-3 landing-fade-in">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 p-2.5 text-white shadow-[0_0_28px_rgba(167,139,250,0.25)] backdrop-blur-md transition hover:bg-white/20"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link
            to="/donate"
            className="inline-flex items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/15 px-6 py-2.5 text-sm font-semibold tracking-wide text-emerald-100 shadow-[0_10px_36px_rgba(16,185,129,0.3)] transition hover:bg-emerald-300/25"
          >
            Donate
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold tracking-wide text-slate-900 shadow-[0_12px_40px_rgba(255,255,255,0.2)] transition hover:bg-slate-100"
          >
            Login
          </Link>
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div className="landing-fade-up">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find your{' '}
              <span className="bg-gradient-to-r from-violet-200 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                perfect companion
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">
              Adopt, Rescue, and give pets a loving home
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/pets"
                className="group inline-flex items-center rounded-2xl bg-gradient-to-r from-violet-500 via-violet-400 to-fuchsia-500 px-7 py-3.5 text-base font-semibold text-white shadow-[0_20px_60px_rgba(167,139,250,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(167,139,250,0.6)]"
              >
                Browse Pets
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                to="/report-stray"
                className="inline-flex items-center rounded-2xl border border-emerald-300/50 bg-emerald-300/15 px-7 py-3.5 text-base font-semibold text-emerald-100 shadow-[0_18px_50px_rgba(16,185,129,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-300/25"
              >
                Report a Stray
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-violet-300/40 bg-white/5 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.45),0_0_40px_rgba(167,139,250,0.35)] backdrop-blur-md landing-fade-in">
            <div className="relative h-[430px] overflow-hidden rounded-2xl">
              {HERO_SLIDES.map((slide, index) => (
                <img
                  key={slide.src}
                  src={slide.src}
                  alt={slide.alt}
                  className={`hero-slide-image absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={goToPreviousSlide}
              className="absolute left-6 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-black/35 p-2.5 text-white backdrop-blur-md transition hover:bg-black/60"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={goToNextSlide}
              className="absolute right-6 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-black/35 p-2.5 text-white backdrop-blur-md transition hover:bg-black/60"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2">
              {HERO_SLIDES.map((slide) => {
                const slideIndex = HERO_SLIDES.findIndex((item) => item.src === slide.src)

                return (
                  <button
                    key={slide.src}
                    type="button"
                    onClick={() => goToSlide(slideIndex)}
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      slideIndex === currentSlide ? 'bg-violet-200 shadow-[0_0_20px_rgba(167,139,250,0.8)]' : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${slideIndex + 1}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl landing-fade-up sm:p-7">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-sky-200">Search pets</p>
          <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
            <label className="group flex h-14 items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/60 px-4 transition duration-300 focus-within:border-violet-300/70 focus-within:shadow-[0_0_24px_rgba(167,139,250,0.45)]">
              <Search className="h-5 w-5 text-slate-300 group-focus-within:text-violet-200" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by pet name, breed, or species"
                className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
              />
            </label>

            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Location"
              className="h-14 rounded-2xl border border-white/15 bg-slate-950/60 px-4 text-sm text-white outline-none transition duration-300 placeholder:text-slate-400 focus:border-violet-300/70 focus:shadow-[0_0_24px_rgba(167,139,250,0.45)]"
            />

            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="h-14 rounded-2xl border border-white/15 bg-slate-950/60 px-4 text-sm capitalize text-white outline-none transition duration-300 focus:border-violet-300/70 focus:shadow-[0_0_24px_rgba(167,139,250,0.45)]"
            >
              {featuredSpecies.map((species) => (
                <option key={species} value={species} className="bg-slate-900 capitalize text-white">
                  {species === 'all' ? 'All types' : species}
                </option>
              ))}
            </select>

            <select
              value={selectedAge}
              onChange={(e) => setSelectedAge(e.target.value)}
              className="h-14 rounded-2xl border border-white/15 bg-slate-950/60 px-4 text-sm text-white outline-none transition duration-300 focus:border-violet-300/70 focus:shadow-[0_0_24px_rgba(167,139,250,0.45)]"
            >
              <option value="all" className="bg-slate-900 text-white">All ages</option>
              <option value="young" className="bg-slate-900 text-white">Young (0-2)</option>
              <option value="adult" className="bg-slate-900 text-white">Adult (3-8)</option>
              <option value="senior" className="bg-slate-900 text-white">Senior (8+)</option>
            </select>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-4 pb-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-8 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.08),rgba(2,6,23,0))]" />
        </div>

        <div className="relative mx-auto max-w-7xl space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4 landing-fade-in">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-violet-200">Available pets</p>
              <h2 className="text-3xl font-bold text-white">Pets you can adopt now</h2>
              <p className="mt-2 text-slate-300">Find your perfect match today</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 text-sm font-semibold text-violet-100">
              Showing {filteredPets.length} of {pets.length}
              </span>
              <Link
                to="/pets"
                className="inline-flex items-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:bg-white/20"
              >
                View All Pets
              </Link>
            </div>
          </div>

          {loading && <p className="text-slate-300">Loading pets...</p>}
          {!loading && error && <p className="text-red-300">{error}</p>}

          {!loading && !error && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPets.length > 0 ? filteredPets.map((pet) => {
                const imageUrl = getImageUrl(pet.image_url)
                const isFavorite = favoritePetIds.includes(pet.id)

                return (
                  <article key={pet.id} className="group landing-card overflow-hidden rounded-3xl border border-violet-300/25 bg-slate-900/85 shadow-[0_26px_72px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_34px_86px_rgba(0,0,0,0.55),0_0_24px_rgba(167,139,250,0.45)]">
                    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(pet.id)}
                        className={`absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition ${
                          isFavorite
                            ? 'border-pink-300/70 bg-pink-500/30 text-pink-100 shadow-[0_0_18px_rgba(244,114,182,0.7)]'
                            : 'border-white/30 bg-black/30 text-white hover:bg-black/50'
                        }`}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      {imageUrl ? (
                        <img src={imageUrl} alt={pet.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-6xl">{getEmoji(pet.species)}</div>
                      )}
                    </div>
                    <div className="space-y-3 p-5">
                      <div>
                        <h3 className="text-xl font-bold text-white">{pet.name}</h3>
                        <p className="text-sm text-slate-300">{pet.breed || 'Mixed breed'} • {pet.species || 'Pet'}</p>
                      </div>

                      <p className="text-sm leading-6 text-slate-300 line-clamp-2">{pet.description || 'A loving pet waiting for a forever home.'}</p>

                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100">
                          <PawPrint className="h-3.5 w-3.5 text-violet-200" />
                          {formatAgeLabel(pet.age)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100">
                          <MapPin className="h-3.5 w-3.5 text-sky-200" />
                          {formatLocation(pet)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100">
                          {isVaccinated(pet) ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" /> : <Syringe className="h-3.5 w-3.5 text-amber-200" />}
                          {isVaccinated(pet) ? 'Vaccinated' : 'Needs vaccine'}
                        </span>
                      </div>

                      <div className="pt-1">
                        <Link
                          to="/login"
                          className="inline-flex items-center rounded-xl bg-gradient-to-r from-violet-500 via-violet-400 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(167,139,250,0.45)] transition duration-300 hover:shadow-[0_16px_45px_rgba(167,139,250,0.65)]"
                        >
                          Start Adoption
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              }) : (
                <p className="text-slate-300">No pets match your search right now.</p>
              )}
            </div>
          )}

          <div className="pt-2">
            <Link
              to="/pets"
              className="inline-flex items-center rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition duration-300 hover:bg-white/20"
            >
              View All Pets
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-rose-200/20 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8 landing-fade-up">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-rose-200">Urgent updates</p>
              <h2 className="text-3xl font-bold text-white">Rescue Stray Animals</h2>
            </div>
            <Link
              to="/report-stray"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(16,185,129,0.4)] transition duration-300 hover:shadow-[0_20px_50px_rgba(16,185,129,0.55)]"
            >
              Report a Stray
            </Link>
          </div>

          {strayReportsLoading && <p className="text-slate-300">Loading stray reports...</p>}
          {!strayReportsLoading && strayReportsError && <p className="text-red-300">{strayReportsError}</p>}

          {!strayReportsLoading && !strayReportsError && (
            <div className="grid gap-4 md:grid-cols-3">
              {strayReports.length > 0 ? strayReports.map((report) => {
                const statusBadge = getStrayStatusBadge(report.status)
                const imageUrl = getImageUrl(report.image_url)

                return (
                  <article key={report.id} className="rounded-2xl border border-white/15 bg-slate-900/70 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(0,0,0,0.4)]">
                    {imageUrl && (
                      <img src={imageUrl} alt="Reported stray" className="mb-4 h-40 w-full rounded-xl object-cover" />
                    )}
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white">{report.location}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-300">
                      {report.description || 'Community members reported a stray animal that may need assistance.'}
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-sky-200" />
                      {formatRelativeTime(report.created_at)}
                    </p>
                  </article>
                )
              }) : (
                <p className="text-slate-300">No active stray reports right now.</p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {[
            { icon: PawPrint, title: 'Browse pets', text: 'Explore profiles and discover pets ready for adoption.' },
            { icon: Send, title: 'Send request', text: 'Submit your adoption request in minutes.' },
            { icon: HomeIcon, title: 'Adopt and bring home', text: 'Complete the process and welcome your new companion.' },
          ].map((step, index) => (
            <article
              key={step.title}
              className="rounded-2xl border border-white/15 bg-white/5 p-6 text-center shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-lg transition duration-300 hover:-translate-y-1.5"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/20 text-violet-100">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-8">
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { icon: '🐾', value: '500+', label: 'Pets Adopted' },
              { icon: '❤️', value: '200+', label: 'Rescues' },
              { icon: '👥', value: '1000+', label: 'Users' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-900/65 p-5 text-center">
                <p className="mb-2 text-2xl">{stat.icon}</p>
                <p className="text-3xl font-extrabold text-white">{stat.value}</p>
                <p className="text-sm text-slate-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-emerald-200/20 bg-gradient-to-r from-emerald-500/20 via-slate-900/70 to-violet-500/20 p-6 shadow-[0_30px_85px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-100">Support rescue</p>
              <h2 className="mt-1 text-3xl font-bold text-white">Support animal rescue efforts</h2>
              <p className="mt-2 text-slate-200">Every donation helps with medical care, shelter, and rehabilitation.</p>
            </div>

            <Link
              to="/donate"
              className="inline-flex items-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3.5 text-base font-semibold text-white shadow-[0_20px_50px_rgba(16,185,129,0.45)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(16,185,129,0.62)]"
            >
              Donate Now
            </Link>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
              <span>Monthly rescue fund</span>
              <span>72%</span>
            </div>
            <div className="h-3 rounded-full bg-white/15">
              <div className="h-3 w-[72%] rounded-full bg-gradient-to-r from-emerald-300 to-teal-300 shadow-[0_0_20px_rgba(110,231,183,0.8)]" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
