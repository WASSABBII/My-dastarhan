'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'
import { sendOtp, verifyOtp, updateClientName, loginOwner, registerRestaurant } from '@/lib/auth'

type AuthType = 'user' | 'rest'
type Step = 'phone' | 'otp' | 'name' | 'success'
type Channel = 'wa' | 'sms'

const CUISINES = ['Казахская', 'Европейская', 'Японская', 'Итальянская', 'Восточная', 'Грузинская']
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function RestaurantLoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'reg'>('login')

  // login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // reg state
  const [regStep, setRegStep] = useState(1)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [capacity, setCapacity] = useState('')
  const [cuisines, setCuisines] = useState<string[]>(['Казахская'])
  const [openTime, setOpenTime] = useState('11:00')
  const [closeTime, setCloseTime] = useState('23:00')
  const [days, setDays] = useState<string[]>(['Пн','Вт','Ср','Чт','Пт','Сб'])
  const [slot, setSlot] = useState('90')
  const [maxGuests, setMaxGuests] = useState('8')
  const [regEmail, setRegEmail] = useState('')
  const [contact, setContact] = useState('')
  const [regPass, setRegPass] = useState('')
  const [showRegPass, setShowRegPass] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')

  const toggleCuisine = (c: string) =>
    setCuisines((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])
  const toggleDay = (d: string) =>
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])

  const handleLogin = async () => {
    if (!email || !password) return
    setLoginLoading(true)
    setLoginError('')
    try {
      await loginOwner(email, password)
      router.push('/admin')
    } catch (e: any) {
      setLoginError(e?.response?.data?.message || 'Неверный email или пароль')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!agreed) return
    setRegLoading(true)
    setRegError('')
    try {
      await registerRestaurant({
        name, address, phone, cuisine_type: cuisines[0] || 'Казахская',
        capacity, working_hours: { open: openTime, close: closeTime },
        email: regEmail, contact_person: contact, password: regPass,
      })
      setSubmitted(true)
    } catch (e: any) {
      setRegError(e?.response?.data?.message || 'Ошибка при подаче заявки')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div>
      {/* TABS */}
      <div className={styles.rModeTabs}>
        <button
          className={`${styles.rModeTab} ${mode === 'login' ? styles.rModeTabActive : ''}`}
          onClick={() => setMode('login')}
        >
          Войти
        </button>
        <button
          className={`${styles.rModeTab} ${mode === 'reg' ? styles.rModeTabActive : ''}`}
          onClick={() => { setMode('reg'); setRegStep(1) }}
        >
          Подключить ресторан
        </button>
      </div>

      {/* ── LOGIN ── */}
      {mode === 'login' && (
        <div>
          <div className={styles.authTitle}>Кабинет ресторана</div>
          <div className={styles.authSubtitle}>Войдите для управления бронированиями</div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email</label>
            <input className={styles.formInput} type="email" placeholder="restaurant@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Пароль</label>
            <div className={styles.passwordRow}>
              <input className={styles.formInput} type={showPass ? 'text' : 'password'}
                placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className={styles.eyeBtn} type="button" onClick={() => setShowPass((v) => !v)}>
                <EyeIcon open={showPass} />
              </button>
            </div>
          </div>

          <div className={styles.forgotRow}>
            <a href="#" className={styles.forgotLink}>Забыли пароль?</a>
          </div>

          {loginError && <div className={styles.errorMsg}>{loginError}</div>}
          <button
            className={styles.submitBtn}
            onClick={handleLogin}
            disabled={!email.trim() || !password.trim() || loginLoading}
          >
            {loginLoading ? 'Вход...' : 'Войти в кабинет'}
          </button>

          <div className={styles.terms}>
            Нет аккаунта?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setMode('reg'); setRegStep(1) }}>
              Подключить ресторан
            </a>
          </div>
        </div>
      )}

      {/* ── REGISTRATION ── */}
      {mode === 'reg' && !submitted && (
        <div>
          {/* Step dots */}
          <div className={styles.stepDots}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`${styles.stepDot} ${i < regStep ? styles.stepDotDone : i === regStep ? styles.stepDotActive : ''}`}
              />
            ))}
          </div>

          {/* STEP 1 — основная информация */}
          {regStep === 1 && (
            <div>
              <div className={styles.authTitle}>Подключить ресторан</div>
              <div className={styles.authSubtitle}>Шаг 1 из 3 — основная информация</div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Название</label>
                <input className={styles.formInput} type="text" placeholder="Дастархан House"
                  value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Адрес</label>
                <input className={styles.formInput} type="text" placeholder="ул. Панфилова, 98, Алматы"
                  value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className={styles.formRowTwo}>
                <div className={styles.formGroup} style={{ margin: 0 }}>
                  <label className={styles.formLabel}>Телефон</label>
                  <input className={styles.formInput} type="tel" placeholder="+7..."
                    value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className={styles.formGroup} style={{ margin: 0 }}>
                  <label className={styles.formLabel}>Вместимость</label>
                  <input className={styles.formInput} type="text" placeholder="80 мест"
                    value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Кухня</label>
                <div className={styles.cuisineGrid}>
                  {CUISINES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.cuisineTag} ${cuisines.includes(c) ? styles.cuisineTagActive : ''}`}
                      onClick={() => toggleCuisine(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button className={styles.submitBtn} onClick={() => setRegStep(2)}
                disabled={!name.trim() || !address.trim()}>
                Далее →
              </button>
            </div>
          )}

          {/* STEP 2 — время работы */}
          {regStep === 2 && (
            <div>
              <div className={styles.authTitle}>Время работы</div>
              <div className={styles.authSubtitle}>Шаг 2 из 3 — расписание</div>

              <div className={styles.rib}>
                <div className={styles.ribTitle}>Часы работы</div>
                <div className={styles.formRowTwo} style={{ marginBottom: 12 }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel}>Открытие</label>
                    <input className={styles.formInput} type="time" value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)} />
                  </div>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel}>Закрытие</label>
                    <input className={styles.formInput} type="time" value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)} />
                  </div>
                </div>
                <div className={styles.cuisineGrid}>
                  {DAYS.map((d) => (
                    <button key={d} type="button"
                      className={`${styles.cuisineTag} ${days.includes(d) ? styles.cuisineTagActive : ''}`}
                      onClick={() => toggleDay(d)}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.rib}>
                <div className={styles.ribTitle}>Параметры брони</div>
                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup} style={{ margin: '0 0 10px' }}>
                    <label className={styles.formLabel}>Слот (мин)</label>
                    <div className={styles.selectWrap}>
                      <select className={styles.formSelect} value={slot} onChange={(e) => setSlot(e.target.value)}>
                        <option value="60">60</option>
                        <option value="90">90</option>
                        <option value="120">120</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.formGroup} style={{ margin: '0 0 10px' }}>
                    <label className={styles.formLabel}>Макс. гостей</label>
                    <div className={styles.selectWrap}>
                      <select className={styles.formSelect} value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)}>
                        <option value="6">6</option>
                        <option value="8">8</option>
                        <option value="10">10</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.btnRow}>
                <button className={styles.backBtn} onClick={() => setRegStep(1)}>← Назад</button>
                <button className={styles.submitBtn} style={{ flex: 1, margin: 0 }} onClick={() => setRegStep(3)}>
                  Далее →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — данные для входа */}
          {regStep === 3 && (
            <div>
              <div className={styles.authTitle}>Данные для входа</div>
              <div className={styles.authSubtitle}>Шаг 3 из 3 — создайте аккаунт</div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input className={styles.formInput} type="email" placeholder="restaurant@email.com"
                  value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Контактное лицо</label>
                <input className={styles.formInput} type="text" placeholder="Имя менеджера"
                  value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Пароль</label>
                <div className={styles.passwordRow}>
                  <input className={styles.formInput} type={showRegPass ? 'text' : 'password'}
                    placeholder="Минимум 8 символов"
                    value={regPass} onChange={(e) => setRegPass(e.target.value)} />
                  <button className={styles.eyeBtn} type="button" onClick={() => setShowRegPass((v) => !v)}>
                    <EyeIcon open={showRegPass} />
                  </button>
                </div>
              </div>

              <div className={styles.rib} style={{ marginBottom: 14 }}>
                <div className={styles.ribNotice}>
                  Наш менеджер свяжется с вами в течение 24 часов для проверки и активации профиля.
                </div>
              </div>

              <label className={styles.agreeRow}>
                <input type="checkbox" className={styles.agreeCheck}
                  checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>Принимаю <a href="#" onClick={(e) => e.preventDefault()}>условия партнёрства</a></span>
              </label>

              {regError && <div className={styles.errorMsg}>{regError}</div>}
              <div className={styles.btnRow}>
                <button className={styles.backBtn} onClick={() => setRegStep(2)}>← Назад</button>
                <button className={styles.submitBtn} style={{ flex: 1, margin: 0 }}
                  disabled={!regEmail.trim() || !regPass.trim() || !agreed || regLoading}
                  onClick={handleRegister}>
                  {regLoading ? 'Отправка...' : 'Подать заявку'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUCCESS ── */}
      {mode === 'reg' && submitted && (
        <div className={styles.successScreen}>
          <div className={styles.successIcon}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="#065f46">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className={styles.successTitle}>
            Заявка отправлена!
          </div>
          <div className={styles.successSubtitle}>
            Наш менеджер свяжется с вами в течение 24 часов. После проверки вы получите доступ к кабинету.
          </div>
          <Link href="/" className={styles.goBtn}>
            На главную →
          </Link>
        </div>
      )}
    </div>
  )
}

function LoginPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [authType, setAuthType] = useState<AuthType>(
    searchParams.get('type') === 'rest' ? 'rest' : 'user'
  )
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [channel, setChannel] = useState<Channel>('wa')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [resendSec, setResendSec] = useState(60)
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // Resend timer
  useEffect(() => {
    if (step !== 'otp') return
    setResendSec(60)
    const timer = setInterval(() => {
      setResendSec((s) => {
        if (s <= 1) { clearInterval(timer); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step])

  const handleSend = async () => {
    if (!phone.trim()) return
    setLoading(true)
    setError('')
    try {
      await sendOtp(phone.trim())
      setStep('otp')
      setTimeout(() => otpRefs[0].current?.focus(), 100)
    } catch {
      setError('Не удалось отправить код. Проверьте номер.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[idx] = digit
    setOtp(next)
    if (digit && idx < 3) {
      otpRefs[idx + 1].current?.focus()
    }
  }

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus()
    }
  }

  const otpFilled = otp.every((d) => d !== '')

  const handleVerify = async () => {
    if (!otpFilled) return
    setLoading(true)
    setError('')
    try {
      const { isNew } = await verifyOtp(phone.trim(), otp.join(''))
      if (isNew) {
        setStep('name')
      } else {
        setStep('success')
      }
    } catch {
      setError('Неверный код. Попробуйте ещё раз.')
      setOtp(['', '', '', ''])
      otpRefs[0].current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleSaveName = async () => {
    if (!firstName.trim()) return
    setLoading(true)
    try {
      await updateClientName(`${firstName.trim()} ${lastName.trim()}`.trim())
      setStep('success')
    } catch {
      setError('Не удалось сохранить имя.')
    } finally {
      setLoading(false)
    }
  }

  const backToPhone = () => {
    setStep('phone')
    setOtp(['', '', '', ''])
  }

  const channelIcon = channel === 'wa' ? '💬' : '📱'
  const channelName = channel === 'wa' ? 'WhatsApp' : 'SMS'

  return (
    <div className={styles.page}>
      {/* ── LEFT PANEL ─────────────────────────── */}
      <div className={styles.leftPanel}>
        <div className={styles.leftDeco1} />
        <div className={styles.leftDeco2} />

        <Link href="/" className={styles.logoLink}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <span className={styles.logoText}>
            Dastarkhan<span>.</span>
          </span>
        </Link>

        <div className={styles.leftHero}>
          <div className={styles.leftQuote}>
            Место, где<br />
            начинается<br />
            <em>дастархан</em>
          </div>
          <p className={styles.leftDesc}>
            Бронируйте лучшие столики Алматы или подключайте ваш ресторан к платформе — всё в одном месте.
          </p>
        </div>

        <div className={styles.leftStats}>
          <div className={styles.lsItem}>
            <div className={styles.lsNum}>120+</div>
            <div className={styles.lsLabel}>Ресторанов</div>
          </div>
          <div className={styles.lsItem}>
            <div className={styles.lsNum}>4 800</div>
            <div className={styles.lsLabel}>Броней / мес</div>
          </div>
          <div className={styles.lsItem}>
            <div className={styles.lsNum}>4.9★</div>
            <div className={styles.lsLabel}>Рейтинг</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────── */}
      <div className={styles.rightPanel}>
        <div className={styles.authBox}>

          {/* TYPE SWITCHER */}
          <div className={styles.typeSwitcher}>
            <button
              className={`${styles.typeBtn} ${authType === 'user' ? styles.typeBtnActive : ''}`}
              onClick={() => { setAuthType('user'); setStep('phone') }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="7" r="4" />
                <path d="M5.2 20a8 8 0 0 1 13.6 0" />
              </svg>
              Я гость
            </button>
            <button
              className={`${styles.typeBtn} ${authType === 'rest' ? styles.typeBtnActive : ''}`}
              onClick={() => { setAuthType('rest'); setStep('phone') }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Я ресторан
            </button>
          </div>

          {/* ── RESTAURANT LOGIN ── */}
          {authType === 'rest' && (
            <RestaurantLoginForm />
          )}

          {/* ── STEP: PHONE ── */}
          {authType === 'user' && step === 'phone' && (
            <div>
              {/* Progress */}
              <div className={styles.progressSteps}>
                <div className={styles.psItem}>
                  <div className={`${styles.psCircle} ${styles.psCircleActive}`}>1</div>
                  <div className={`${styles.psLabel} ${styles.psLabelActive}`}>Номер</div>
                </div>
                <div className={styles.psConnector} />
                <div className={styles.psItem}>
                  <div className={`${styles.psCircle} ${styles.psCirclePending}`}>2</div>
                  <div className={styles.psLabel}>Код</div>
                </div>
                <div className={styles.psConnector} />
                <div className={styles.psItem}>
                  <div className={`${styles.psCircle} ${styles.psCirclePending}`}>3</div>
                  <div className={styles.psLabel}>Готово</div>
                </div>
              </div>

              <div className={styles.authTitle}>Войти или создать аккаунт</div>
              <div className={styles.authSubtitle}>Введите номер — отправим код подтверждения</div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Номер телефона</label>
                <div className={`${styles.phoneRow} ${phoneFocused ? styles.phoneRowFocused : ''}`}>
                  <div className={styles.countryCode}>
                    <span className={styles.flag}>🇰🇿</span>
                    <span>+7</span>
                    <span className={styles.caret}>▾</span>
                  </div>
                  <input
                    className={styles.phoneNumInput}
                    type="tel"
                    placeholder="777 123 45 67"
                    maxLength={13}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                </div>
              </div>

              <div className={styles.channelLabelRow}>Куда отправить код?</div>
              <div className={styles.channelSelector}>
                <button
                  className={`${styles.channelBtn} ${channel === 'wa' ? styles.channelBtnActive : ''}`}
                  onClick={() => setChannel('wa')}
                >
                  <span className={styles.chIcon}>💬</span>
                  <span className={styles.chName}>WhatsApp</span>
                  <span className={styles.chHint}>Рекомендуем</span>
                </button>
                <button
                  className={`${styles.channelBtn} ${channel === 'sms' ? styles.channelBtnActive : ''}`}
                  onClick={() => setChannel('sms')}
                >
                  <span className={styles.chIcon}>📱</span>
                  <span className={styles.chName}>SMS</span>
                  <span className={styles.chHint}>Twilio</span>
                </button>
              </div>

              {error && <div className={styles.errorMsg}>{error}</div>}
              <button
                className={styles.submitBtn}
                onClick={handleSend}
                disabled={!phone.trim() || loading}
              >
                {loading ? 'Отправка...' : 'Получить код'}
              </button>

              <div className={styles.terms}>
                Нажимая кнопку, вы принимаете{' '}
                <a href="#">условия использования</a> и{' '}
                <a href="#">политику конфиденциальности</a>
              </div>
            </div>
          )}

          {/* ── STEP: OTP ── */}
          {authType === 'user' && step === 'otp' && (
            <div>
              {/* Progress */}
              <div className={styles.progressSteps}>
                <div className={styles.psItem}>
                  <div className={`${styles.psCircle} ${styles.psCircleDone}`}>✓</div>
                  <div className={styles.psLabel}>Номер</div>
                </div>
                <div className={`${styles.psConnector} ${styles.psConnectorDone}`} />
                <div className={styles.psItem}>
                  <div className={`${styles.psCircle} ${styles.psCircleActive}`}>2</div>
                  <div className={`${styles.psLabel} ${styles.psLabelActive}`}>Код</div>
                </div>
                <div className={styles.psConnector} />
                <div className={styles.psItem}>
                  <div className={`${styles.psCircle} ${styles.psCirclePending}`}>3</div>
                  <div className={styles.psLabel}>Готово</div>
                </div>
              </div>

              <div className={styles.authTitle}>Введите код</div>
              <div className={styles.authSubtitle}>4-значный код подтверждения</div>

              <div className={styles.sentInfo}>
                <span className={styles.sentInfoIcon}>{channelIcon}</span>
                <div className={styles.sentInfoText}>
                  Код отправлен через <strong>{channelName}</strong> на<br />
                  <span className={styles.sentInfoPhone}>+7 {phone}</span>
                </div>
              </div>

              <div className={styles.otpRow}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    className={`${styles.otpCell} ${digit ? styles.otpCellFilled : ''}`}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>
              <div className={styles.otpHint}>
                {otpFilled ? 'Нажмите "Подтвердить"' : 'Введите 4 цифры из сообщения'}
              </div>

              <div className={styles.resendRow}>
                {resendSec > 0 ? (
                  <>Отправить повторно через <strong>{resendSec}</strong> сек</>
                ) : (
                  <span className={styles.resendLink} onClick={() => setStep('phone')}>
                    Отправить повторно
                  </span>
                )}
              </div>

              {error && <div className={styles.errorMsg}>{error}</div>}
              <div className={styles.btnRow}>
                <button className={styles.backBtn} onClick={backToPhone}>
                  ← Назад
                </button>
                <button
                  className={styles.submitBtn}
                  style={{ flex: 1 }}
                  onClick={handleVerify}
                  disabled={!otpFilled || loading}
                >
                  {loading ? 'Проверка...' : 'Подтвердить'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: NAME (new user) ── */}
          {authType === 'user' && step === 'name' && (
            <div>
              {/* Progress */}
              <div className={styles.progressSteps}>
                <div className={styles.psItem}>
                  <div className={`${styles.psCircle} ${styles.psCircleDone}`}>✓</div>
                  <div className={styles.psLabel}>Номер</div>
                </div>
                <div className={`${styles.psConnector} ${styles.psConnectorDone}`} />
                <div className={styles.psItem}>
                  <div className={`${styles.psCircle} ${styles.psCircleDone}`}>✓</div>
                  <div className={styles.psLabel}>Код</div>
                </div>
                <div className={`${styles.psConnector} ${styles.psConnectorDone}`} />
                <div className={styles.psItem}>
                  <div className={`${styles.psCircle} ${styles.psCircleActive}`}>3</div>
                  <div className={`${styles.psLabel} ${styles.psLabelActive}`}>Готово</div>
                </div>
              </div>

              <div className={styles.welcomeBox}>
                <div className={styles.welcomeBoxIcon}>👋</div>
                <div className={styles.welcomeBoxText}>
                  Похоже, вы у нас впервые!<br />
                  Как вас зовут? Имя нужно для бронирований.
                </div>
              </div>

              <div className={styles.authTitle}>Как вас зовут?</div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Имя</label>
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Айгерим"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Фамилия{' '}
                  <span style={{ fontSize: '10px', fontWeight: 300, letterSpacing: 0, textTransform: 'none', color: 'var(--text-muted)' }}>
                    (необязательно)
                  </span>
                </label>
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Касымова"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
              </div>

              <button
                className={styles.submitBtn}
                onClick={handleSaveName}
                disabled={!firstName.trim()}
              >
                <span>Начать пользоваться</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          )}

          {/* ── STEP: SUCCESS ── */}
          {authType === 'user' && step === 'success' && (
            <div className={styles.successScreen}>
              <div className={styles.successIcon}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className={styles.successTitle}>
                Добро пожаловать,<br />
                <span style={{ color: 'var(--primary)' }}>
                  {firstName ? `${firstName}!` : 'снова!'}
                </span>
              </div>
              <div className={styles.successSubtitle}>
                Вы вошли в аккаунт. Теперь можно бронировать столики в любимых ресторанах Алматы.
              </div>
              <Link href="/" className={styles.goBtn}>
                Найти ресторан →
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}
