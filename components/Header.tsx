import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import useAuth from '../hooks/useAuth'

type ModalType = 'account' | 'payment' | null

function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [profileImage, setProfileImage] = useState('/channelicon.png')
  const [feedback, setFeedback] = useState('')
  const { logout, user } = useAuth()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const accountStorageKey = user ? `account-settings:${user.email}` : null
  const paymentStorageKey = user ? `payment-settings:${user.email}` : null
  const [accountForm, setAccountForm] = useState({
    fullName: '',
    email: '',
    language: 'Azərbaycanca',
  })
  const [paymentForm, setPaymentForm] = useState({
    cardName: '',
    cardNumber: '',
    expiry: '',
    plan: 'Premium',
  })
  const profileInitial = (accountForm.fullName || user?.email || 'P')
    .trim()
    .slice(0, 1)
    .toUpperCase()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    const savedAccount = accountStorageKey
      ? window.localStorage.getItem(accountStorageKey)
      : null
    const savedPayment = paymentStorageKey
      ? window.localStorage.getItem(paymentStorageKey)
      : null

    setAccountForm(
      savedAccount
        ? JSON.parse(savedAccount)
        : {
            fullName: user.email.split('@')[0],
            email: user.email,
            language: 'Azərbaycanca',
          }
    )

    setPaymentForm(
      savedPayment
        ? JSON.parse(savedPayment)
        : {
            cardName: user.email.split('@')[0],
            cardNumber: '**** **** **** 4242',
            expiry: '12/28',
            plan: 'Premium',
          }
    )
  }, [accountStorageKey, paymentStorageKey, user])

  useEffect(() => {
    if (!activeModal) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveModal(null)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [activeModal])

  function saveAccountSettings() {
    if (accountStorageKey) {
      window.localStorage.setItem(accountStorageKey, JSON.stringify(accountForm))
    }

    setFeedback('Hesab məlumatları yeniləndi')
    setActiveModal(null)
  }

  function savePaymentSettings() {
    if (paymentStorageKey) {
      window.localStorage.setItem(paymentStorageKey, JSON.stringify(paymentForm))
    }

    setFeedback('Ödəniş məlumatları yeniləndi')
    setActiveModal(null)
  }

  const maskedCard =
    paymentForm.cardNumber.trim() || '**** **** **** 4242'

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition duration-300 ${
          isScrolled
            ? 'bg-[#0b0b0b]'
            : 'bg-gradient-to-b from-black/80 via-black/35 to-transparent'
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-4 lg:gap-8">
            <Link
              href="/live"
              className="flex items-center rounded-full border border-transparent px-2 py-1 transition hover:border-white/10 hover:bg-white/5"
            >
              <img
                src="/main-logo.png"
                alt="site logo"
                className="h-9 w-auto object-contain sm:h-10"
              />
            </Link>

            <nav className="hidden items-center md:flex">
              <Link
                href="/live"
                className="text-sm font-medium tracking-[0.12em] text-white/72 transition hover:text-white"
              >
                Canlı TV
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="group flex items-center gap-3 px-1 py-1 pr-2 transition"
                onClick={() => setMenuOpen((previous) => !previous)}
              >
                <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded bg-[#1a1a1a]">
                  <img
                    src={profileImage}
                    alt="profile avatar"
                    className="h-full w-full object-cover"
                    onError={() => setProfileImage('/avatar.png')}
                  />
                  <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white">
                    {profileInitial}
                  </span>
                </span>

                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block truncate text-sm font-medium text-white/95">
                    {accountForm.fullName || 'Profil'}
                  </span>
                  <span className="block truncate text-[11px] text-white/45">
                    {accountForm.email || user?.email || 'Profil'}
                  </span>
                </span>

                <svg
                  className={`hidden h-4 w-4 text-white/60 transition sm:block ${
                    menuOpen ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-[calc(100%+12px)] w-[280px] overflow-hidden border border-[#2a2a2a] bg-[#141414] shadow-[0_12px_32px_rgba(0,0,0,0.55)]">
                  <div className="border-b border-[#2a2a2a] p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded bg-[#1f1f1f]">
                        <img
                          src={profileImage}
                          alt="profile avatar"
                          className="h-full w-full object-cover"
                          onError={() => setProfileImage('/avatar.png')}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {accountForm.fullName || 'İstifadəçi'}
                        </p>
                        <p className="truncate text-xs text-white/45">
                          {accountForm.email || user?.email || 'mail yoxdur'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-white/85 transition hover:bg-[#232323]"
                      onClick={() => {
                        setMenuOpen(false)
                        setActiveModal('account')
                      }}
                    >
                      <span>Hesab ayarları</span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-white/85 transition hover:bg-[#232323]"
                      onClick={() => {
                        setMenuOpen(false)
                        setActiveModal('payment')
                      }}
                    >
                      <span>Ödəniş</span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-red-200 transition hover:bg-[#232323]"
                      onClick={logout}
                    >
                      <span>Çıxış</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {feedback ? (
        <div className="fixed bottom-5 right-5 z-[70]">
          <div className="border border-[#2a2a2a] bg-[#111] px-4 py-3 text-sm text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-3">
              <span>{feedback}</span>
              <button
                type="button"
                className="border border-[#2a2a2a] px-2 py-1 text-xs text-white/60 transition hover:bg-[#232323] hover:text-white"
                onClick={() => setFeedback('')}
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeModal ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden border border-[#2a2a2a] bg-[#141414] shadow-[0_30px_80px_rgba(0,0,0,0.65)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="border-b border-[#2a2a2a] p-6 lg:border-b-0 lg:border-r">
                <h2 className="mt-4 text-3xl font-semibold text-white">
                  {activeModal === 'account' ? 'Hesab ayarları' : 'Ödəniş'}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/60">
                  {activeModal === 'account'
                    ? 'Profil məlumatlarınızı, dil seçimini və hesab görünüşünü buradan idarə edin.'
                    : 'Abunə planı və kart məlumatları burada saxlanılır. Dəyişikliklər bu cihazda yadda qalır.'}
                </p>

                <div className="mt-8 space-y-3 text-sm text-white/55">
                  <p>{accountForm.fullName || user?.email || 'Profil'}</p>
                  <p>{activeModal === 'account' ? accountForm.language : maskedCard}</p>
                </div>
              </div>

              <div className="relative p-6">
                <button
                  type="button"
                  className="absolute right-6 top-6 border border-[#2a2a2a] px-3 py-1.5 text-xs text-white/60 transition hover:bg-[#232323] hover:text-white"
                  onClick={() => setActiveModal(null)}
                >
                  Bağla
                </button>

                {activeModal === 'account' ? (
                  <div className="mt-12 space-y-5">
                    <label className="block">
                      <span className="mb-2 block text-sm text-white/65">Ad soyad</span>
                      <input
                        className="input"
                        value={accountForm.fullName}
                        onChange={(event) =>
                          setAccountForm((previous) => ({
                            ...previous,
                            fullName: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-white/65">E-poçt</span>
                      <input
                        className="input"
                        value={accountForm.email}
                        onChange={(event) =>
                          setAccountForm((previous) => ({
                            ...previous,
                            email: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-white/65">Dil</span>
                      <select
                        className="input"
                        value={accountForm.language}
                        onChange={(event) =>
                          setAccountForm((previous) => ({
                            ...previous,
                            language: event.target.value,
                          }))
                        }
                      >
                        <option>Azərbaycanca</option>
                        <option>Türkcə</option>
                        <option>English</option>
                      </select>
                    </label>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        className="bg-[#e50914] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff1b27]"
                        onClick={saveAccountSettings}
                      >
                        Yadda saxla
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-12 space-y-5">
                    <label className="block">
                      <span className="mb-2 block text-sm text-white/65">Kart sahibi</span>
                      <input
                        className="input"
                        value={paymentForm.cardName}
                        onChange={(event) =>
                          setPaymentForm((previous) => ({
                            ...previous,
                            cardName: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-white/65">Kart nömrəsi</span>
                      <input
                        className="input"
                        value={paymentForm.cardNumber}
                        onChange={(event) =>
                          setPaymentForm((previous) => ({
                            ...previous,
                            cardNumber: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm text-white/65">Son tarix</span>
                        <input
                          className="input"
                          value={paymentForm.expiry}
                          onChange={(event) =>
                            setPaymentForm((previous) => ({
                              ...previous,
                              expiry: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm text-white/65">Plan</span>
                        <select
                          className="input"
                          value={paymentForm.plan}
                          onChange={(event) =>
                            setPaymentForm((previous) => ({
                              ...previous,
                              plan: event.target.value,
                            }))
                          }
                        >
                          <option>Basic</option>
                          <option>Standard</option>
                          <option>Premium</option>
                        </select>
                      </label>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        className="bg-[#e50914] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff1b27]"
                        onClick={savePaymentSettings}
                      >
                        Yadda saxla
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default Header
