'use client'
import { useBookingStore } from '@/store/booking.store'
import BookingWizard from '@/components/booking/BookingWizard'
import Step1 from '@/components/booking/Step1'
import Step2 from '@/components/booking/Step2'
import Step3 from '@/components/booking/Step3'
import styles from './page.module.css'

export default function BookingPage() {
  const step = useBookingStore(s => s.step)

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <BookingWizard step={step}>
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
        </BookingWizard>
      </div>
    </div>
  )
}
