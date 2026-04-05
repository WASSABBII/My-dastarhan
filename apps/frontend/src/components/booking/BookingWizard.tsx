import styles from './BookingWizard.module.css'

interface BookingWizardProps {
  step: 1 | 2 | 3
  children: React.ReactNode
}

const STEPS = ['Выбор стола', 'Детали', 'Подтверждение']

export default function BookingWizard({ step, children }: BookingWizardProps) {
  return (
    <div className={styles.wizard}>
      <div className={styles.progress}>
        {STEPS.map((label, i) => {
          const num = i + 1
          const done = num < step
          const active = num === step
          return (
            <div key={i} className={styles.stepItem}>
              {i > 0 && <div className={`${styles.line} ${done ? styles.lineDone : ''}`} />}
              <div className={`${styles.circle} ${done ? styles.done : ''} ${active ? styles.active : ''}`}>
                {done ? '✓' : num}
              </div>
              <span className={`${styles.stepLabel} ${active ? styles.activeLabel : ''}`}>{label}</span>
            </div>
          )
        })}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  )
}
